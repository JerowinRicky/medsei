import axios from "axios";
import fs from "fs";
import FormData from "form-data";
import { prisma } from "../prisma/client.js";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

export class DocumentAiService {
  /**
   * Dispatch document to Python AI microservice for OCR and Entity Extraction
   */
  static async processDocument(documentId: string, filePath: string, fileName: string, taskId: string) {
    try {
      // 1. Mark Document as OCR_PROCESSING
      await prisma.document.update({
        where: { id: documentId },
        data: { status: "OCR_PROCESSING" }
      });

      // 2. Dispatch to Python FastAPI Service
      const form = new FormData();
      form.append("file", fs.createReadStream(filePath), fileName);

      const response = await axios.post(
        `${AI_SERVICE_URL}/api/v1/extract?taskId=${taskId}&documentId=${documentId}`,
        form,
        {
          headers: form.getHeaders(),
          timeout: 60000
        }
      );

      const result = response.data;
      const extractedFields = result.extracted_fields || {};

      // Calculate average confidence
      const confidences: number[] = Object.values(extractedFields).map((f: any) => f.confidence || 0.9);
      const avgConfidence = confidences.length ? confidences.reduce((a, b) => a + b, 0) / confidences.length : 0.92;

      // 3. Update Document Record
      await prisma.document.update({
        where: { id: documentId },
        data: {
          status: "AI_EXTRACTION_COMPLETED",
          ocrConfidence: avgConfidence,
          extractedData: extractedFields
        }
      });

      // 4. Update Task status if all documents finished
      const task = await prisma.task.findUnique({
        where: { id: taskId },
        include: { documents: true }
      });

      if (task) {
        const allDone = task.documents.every(d => d.status === "AI_EXTRACTION_COMPLETED" || d.id === documentId);
        if (allDone) {
          // Merge extracted fields into task clinical data if needed
          await prisma.task.update({
            where: { id: taskId },
            data: { status: "EXTRACTION_COMPLETED" }
          });
        }
      }

      return result;
    } catch (err: any) {
      console.error(`Error processing document ${documentId} with AI service:`, err.message);
      await prisma.document.update({
        where: { id: documentId },
        data: { status: "FAILED" }
      });
      throw err;
    }
  }

  /**
   * Resolve precedence and merge HMS structured data with OCR/AI extracted fields
   */
  static resolveClinicalPrecedence(hmsData: any, aiFields: any, manualData?: any) {
    const merged: any = {
      patient: {},
      admission: {},
      attendingDoctor: {},
      clinical: {}
    };

    const conflicts: any[] = [];

    const resolveField = (category: string, field: string, hmsVal: any, aiValObj: any, manualVal?: any) => {
      const aiVal = aiValObj?.value;
      const aiConfidence = aiValObj?.confidence;
      const aiSource = aiValObj?.source_document || "OCR / AI Extraction";

      if (manualVal !== undefined && manualVal !== null && manualVal !== "") {
        merged[category][field] = {
          value: manualVal,
          source: "MANUAL_VERIFIED",
          confidence: 1.0,
          status: "VERIFIED"
        };
        return;
      }

      if (hmsVal && aiVal && String(hmsVal).trim().toLowerCase() !== String(aiVal).trim().toLowerCase()) {
        conflicts.push({
          category,
          field,
          hmsValue: hmsVal,
          documentValue: aiVal,
          confidence: aiConfidence,
          documentSource: aiSource
        });
        // Default precedence: HMS structured data takes priority unless manual
        merged[category][field] = {
          value: hmsVal,
          source: "HMS",
          confidence: 1.0,
          status: "CONFLICT_DEFAULT_HMS"
        };
      } else if (hmsVal) {
        merged[category][field] = {
          value: hmsVal,
          source: "HMS",
          confidence: 1.0,
          status: "VERIFIED"
        };
      } else if (aiVal) {
        merged[category][field] = {
          value: aiVal,
          source: "DOCUMENT_AI",
          confidence: aiConfidence || 0.9,
          status: (aiConfidence || 0.9) >= 0.85 ? "VERIFIED" : "LOW_CONFIDENCE"
        };
      } else {
        merged[category][field] = {
          value: null,
          source: "NONE",
          confidence: 0,
          status: "MISSING"
        };
      }
    };

    // Patient Demographics
    resolveField("patient", "fullName", hmsData?.patient?.fullName, aiFields?.patient_name, manualData?.patient?.fullName);
    resolveField("patient", "uhid", hmsData?.patient?.uhid, aiFields?.uhid, manualData?.patient?.uhid);
    resolveField("patient", "age", hmsData?.patient?.age, aiFields?.age, manualData?.patient?.age);
    resolveField("patient", "gender", hmsData?.patient?.gender, aiFields?.gender, manualData?.patient?.gender);
    resolveField("patient", "phone", hmsData?.patient?.phone, null, manualData?.patient?.phone);
    resolveField("patient", "address", hmsData?.patient?.address, null, manualData?.patient?.address);

    // Admission
    resolveField("admission", "admissionDate", hmsData?.admission?.admissionDate, aiFields?.admission_date, manualData?.admission?.admissionDate);
    resolveField("admission", "department", hmsData?.admission?.department, null, manualData?.admission?.department);

    // Doctor
    resolveField("attendingDoctor", "name", hmsData?.attendingDoctor?.name, aiFields?.attending_doctor, manualData?.attendingDoctor?.name);

    // Clinical
    resolveField("clinical", "diagnosis", hmsData?.clinical?.diagnosis, aiFields?.diagnosis, manualData?.clinical?.diagnosis);
    resolveField("clinical", "allergies", hmsData?.clinical?.allergies, aiFields?.allergies, manualData?.clinical?.allergies);
    resolveField("clinical", "procedures", hmsData?.clinical?.procedures, aiFields?.procedures, manualData?.clinical?.procedures);
    resolveField("clinical", "medications", hmsData?.clinical?.medications, aiFields?.medications, manualData?.clinical?.medications);
    resolveField("clinical", "followUp", hmsData?.clinical?.followUp, aiFields?.follow_up, manualData?.clinical?.followUp);

    return { merged, conflicts };
  }
}

