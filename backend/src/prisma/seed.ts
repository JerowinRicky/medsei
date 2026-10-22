import { prisma } from "./client.js";
import bcrypt from "bcryptjs";

export async function seedDatabase() {
  console.log("Seeding Database with Hospital Multi-Tenant Entities...");

  // 1. Organization
  const org = await prisma.organization.upsert({
    where: { slug: "amvion-health" },
    update: {},
    create: {
      name: "Amvion Healthcare Systems",
      slug: "amvion-health",
      code: "AMVION",
      licenseType: "ENTERPRISE",
      status: "ACTIVE",
      contactEmail: "admin@amvionhealth.org",
      contactPhone: "+1-800-555-0199",
      address: "100 Medical Center Way, Suite 400"
    }
  });

  // 2. Hospital & Departments
  const hospital = await prisma.hospital.upsert({
    where: {
      organizationId_code: {
        organizationId: org.id,
        code: "HOSP-01"
      }
    },
    update: {},
    create: {
      organizationId: org.id,
      name: "Amvion Memorial Hospital",
      code: "HOSP-01",
      city: "Metro City",
      state: "CA",
      country: "USA",
      status: "ACTIVE"
    }
  });

  const cardiologyDept = await prisma.department.upsert({
    where: {
      organizationId_code: {
        organizationId: org.id,
        code: "CARDIO"
      }
    },
    update: {},
    create: {
      organizationId: org.id,
      hospitalId: hospital.id,
      name: "Cardiology Department",
      code: "CARDIO",
      description: "Department of Cardiovascular Sciences"
    }
  });

  const generalMedDept = await prisma.department.upsert({
    where: {
      organizationId_code: {
        organizationId: org.id,
        code: "GENMED"
      }
    },
    update: {},
    create: {
      organizationId: org.id,
      hospitalId: hospital.id,
      name: "General Internal Medicine",
      code: "GENMED",
      description: "Adult inpatient internal medicine care"
    }
  });

  // 3. Permissions
  const permissionsList = [
    { code: "USER_VIEW", name: "View Users", module: "USERS" },
    { code: "USER_CREATE", name: "Create Users", module: "USERS" },
    { code: "USER_EDIT", name: "Edit Users", module: "USERS" },
    { code: "USER_DELETE", name: "Delete Users", module: "USERS" },
    { code: "PATIENT_VIEW", name: "View Patients", module: "PATIENTS" },
    { code: "PATIENT_SEARCH", name: "Search Patients", module: "PATIENTS" },
    { code: "TASK_CREATE", name: "Create Tasks", module: "TASKS" },
    { code: "TASK_VIEW", name: "View Tasks", module: "TASKS" },
    { code: "TASK_EDIT", name: "Edit Tasks", module: "TASKS" },
    { code: "TASK_DELETE", name: "Delete Tasks", module: "TASKS" },
    { code: "DOCUMENT_UPLOAD", name: "Upload Documents", module: "DOCUMENTS" },
    { code: "DOCUMENT_VIEW", name: "View Documents", module: "DOCUMENTS" },
    { code: "DOCUMENT_DELETE", name: "Delete Documents", module: "DOCUMENTS" },
    { code: "SUMMARY_GENERATE", name: "Generate Summary", module: "SUMMARIES" },
    { code: "SUMMARY_REGENERATE", name: "Regenerate Summary", module: "SUMMARIES" },
    { code: "SUMMARY_APPROVE", name: "Approve Summary", module: "SUMMARIES" },
    { code: "SUMMARY_EXPORT", name: "Export Summary", module: "SUMMARIES" },
    { code: "HMS_VIEW", name: "View HMS Configurations", module: "HMS" },
    { code: "HMS_CONFIGURE", name: "Configure HMS", module: "HMS" },
    { code: "HMS_TEST_CONNECTION", name: "Test HMS Connection", module: "HMS" },
    { code: "TEMPLATE_VIEW", name: "View Templates", module: "TEMPLATES" },
    { code: "TEMPLATE_CREATE", name: "Create Templates", module: "TEMPLATES" },
    { code: "TEMPLATE_EDIT", name: "Edit Templates", module: "TEMPLATES" },
    { code: "TEMPLATE_DELETE", name: "Delete Templates", module: "TEMPLATES" },
    { code: "AUDIT_VIEW", name: "View Audit Logs", module: "AUDIT" },
    { code: "SYSTEM_CONFIGURE", name: "Configure System Settings", module: "SETTINGS" }
  ];

  const createdPermissions = [];
  for (const p of permissionsList) {
    const perm = await prisma.permission.upsert({
      where: { code: p.code },
      update: {},
      create: p
    });
    createdPermissions.push(perm);
  }

  // 4. Default Roles
  const rolesDef = [
    { name: "Super Admin", code: "SUPER_ADMIN", isSystem: true, allPerms: true },
    { name: "Hospital Admin", code: "HOSPITAL_ADMIN", isSystem: true, allPerms: true },
    { name: "Doctor", code: "DOCTOR", isSystem: true, perms: ["PATIENT_VIEW", "PATIENT_SEARCH", "TASK_CREATE", "TASK_VIEW", "TASK_EDIT", "DOCUMENT_UPLOAD", "DOCUMENT_VIEW", "SUMMARY_GENERATE", "SUMMARY_REGENERATE", "SUMMARY_APPROVE", "SUMMARY_EXPORT", "TEMPLATE_VIEW"] },
    { name: "Reviewer", code: "REVIEWER", isSystem: true, perms: ["PATIENT_VIEW", "PATIENT_SEARCH", "TASK_VIEW", "TASK_EDIT", "DOCUMENT_VIEW", "SUMMARY_GENERATE", "SUMMARY_APPROVE", "SUMMARY_EXPORT"] },
    { name: "Medical Staff", code: "MEDICAL_STAFF", isSystem: true, perms: ["PATIENT_VIEW", "PATIENT_SEARCH", "TASK_CREATE", "TASK_VIEW", "DOCUMENT_UPLOAD", "DOCUMENT_VIEW", "SUMMARY_GENERATE", "SUMMARY_EXPORT"] },
    { name: "Data Entry Operator", code: "DATA_ENTRY", isSystem: true, perms: ["PATIENT_VIEW", "PATIENT_SEARCH", "TASK_CREATE", "TASK_VIEW", "DOCUMENT_UPLOAD", "DOCUMENT_VIEW"] },
    { name: "Auditor", code: "AUDITOR", isSystem: true, perms: ["PATIENT_VIEW", "TASK_VIEW", "DOCUMENT_VIEW", "AUDIT_VIEW", "SUMMARY_EXPORT"] }
  ];

  const roleMap: Record<string, any> = {};
  for (const r of rolesDef) {
    const role = await prisma.role.upsert({
      where: {
        organizationId_code: {
          organizationId: org.id,
          code: r.code
        }
      },
      update: {},
      create: {
        organizationId: org.id,
        name: r.name,
        code: r.code,
        isSystem: r.isSystem,
        description: `${r.name} role with clinical enterprise privileges.`
      }
    });
    roleMap[r.code] = role;

    // Attach permissions
    const permsToAssign = r.allPerms 
      ? createdPermissions 
      : createdPermissions.filter(p => r.perms?.includes(p.code));

    for (const p of permsToAssign) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: p.id
          }
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: p.id
        }
      });
    }
  }

  // 5. Default Users
  const passwordHash = await bcrypt.hash("Admin@123456", 10);
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@amvionhealth.org" },
    update: {},
    create: {
      organizationId: org.id,
      email: "admin@amvionhealth.org",
      passwordHash,
      firstName: "Sarah",
      lastName: "Jenkins",
      title: "Chief Medical Information Officer",
      roleId: roleMap["SUPER_ADMIN"].id,
      status: "ACTIVE"
    }
  });

  const doctorUser = await prisma.user.upsert({
    where: { email: "dr.kumar@amvionhealth.org" },
    update: {},
    create: {
      organizationId: org.id,
      email: "dr.kumar@amvionhealth.org",
      passwordHash,
      firstName: "Arun",
      lastName: "Kumar",
      title: "Attending Cardiologist, MD FACC",
      roleId: roleMap["DOCTOR"].id,
      status: "ACTIVE"
    }
  });

  // 6. Document Types
  const docTypes = [
    { name: "Discharge Note", code: "DISCHARGE_NOTE", allowedExtensions: "pdf,jpg,jpeg,png,tiff", maxFileSizeMb: 25 },
    { name: "Lab Report", code: "LAB_REPORT", allowedExtensions: "pdf,jpg,jpeg,png", maxFileSizeMb: 15 },
    { name: "Prescription", code: "PRESCRIPTION", allowedExtensions: "pdf,jpg,jpeg,png", maxFileSizeMb: 10 },
    { name: "Operative Note", code: "OPERATIVE_NOTE", allowedExtensions: "pdf,jpg,jpeg,png", maxFileSizeMb: 25 },
    { name: "Radiology Report", code: "RADIOLOGY_REPORT", allowedExtensions: "pdf,jpg,jpeg,png", maxFileSizeMb: 50 },
    { name: "Patient Details Sheet", code: "PATIENT_DETAILS", allowedExtensions: "pdf,jpg,jpeg,png", maxFileSizeMb: 10 },
    { name: "Doctor Notes", code: "DOCTOR_NOTES", allowedExtensions: "pdf,jpg,jpeg,png", maxFileSizeMb: 20 },
    { name: "Insurance Document", code: "INSURANCE_DOC", allowedExtensions: "pdf,jpg,jpeg,png", maxFileSizeMb: 15 }
  ];

  const docTypeMap: Record<string, any> = {};
  for (const dt of docTypes) {
    const docType = await prisma.documentType.upsert({
      where: { code: dt.code },
      update: {},
      create: {
        organizationId: org.id,
        name: dt.name,
        code: dt.code,
        allowedExtensions: dt.allowedExtensions,
        maxFileSizeMb: dt.maxFileSizeMb,
        ocrRequired: true,
        aiExtractionRequired: true,
        active: true
      }
    });
    docTypeMap[dt.code] = docType;
  }

  // 7. Project & Project Types
  const project = await prisma.project.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      organizationId: org.id,
      hospitalId: hospital.id,
      departmentId: cardiologyDept.id,
      name: "Inpatient Clinical Discharge Summaries",
      description: "Standardized inpatient discharge summary pipeline with triple-source ingestion",
      dataSource: "HMS_AND_DOCUMENT",
      status: "ACTIVE",
      createdById: adminUser.id
    }
  });

  const dischargeProjType = await prisma.projectType.upsert({
    where: {
      projectId_code: {
        projectId: project.id,
        code: "DISCHARGE_SUMMARY"
      }
    },
    update: {},
    create: {
      projectId: project.id,
      name: "Discharge Summary",
      code: "DISCHARGE_SUMMARY",
      description: "Standard hospital inpatient discharge summary document",
      dataSource: "HMS_AND_DOCUMENT",
      requiresDocumentReview: true,
      requiresAiValidation: true,
      requiresDoctorApproval: true,
      requiresFinalApproval: true,
      active: true
    }
  });

  // Link required doc types
  await prisma.projectDocumentType.upsert({
    where: {
      projectTypeId_documentTypeId: {
        projectTypeId: dischargeProjType.id,
        documentTypeId: docTypeMap["DISCHARGE_NOTE"].id
      }
    },
    update: {},
    create: {
      projectTypeId: dischargeProjType.id,
      documentTypeId: docTypeMap["DISCHARGE_NOTE"].id,
      isRequired: true,
      priority: 1
    }
  });

  await prisma.projectDocumentType.upsert({
    where: {
      projectTypeId_documentTypeId: {
        projectTypeId: dischargeProjType.id,
        documentTypeId: docTypeMap["LAB_REPORT"].id
      }
    },
    update: {},
    create: {
      projectTypeId: dischargeProjType.id,
      documentTypeId: docTypeMap["LAB_REPORT"].id,
      isRequired: false,
      priority: 2
    }
  });

  // 8. HMS Connection Setup (Configurable REST/Mock HMS)
  const hmsConn = await prisma.hmsConnection.upsert({
    where: { id: "00000000-0000-0000-0000-000000000010" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000010",
      organizationId: org.id,
      hospitalName: "Amvion Memorial Hospital",
      hmsName: "Amvion Enterprise HMS (REST Gateway)",
      integrationType: "REST",
      baseUrl: "http://localhost:5000/api/v1/mock-hms",
      authType: "BEARER",
      apiKeyEncrypted: "encrypted_token_9999",
      timeoutMs: 15000,
      retryCount: 3,
      active: true,
      lastTestedAt: new Date(),
      lastTestStatus: "SUCCESS"
    }
  });

  // Endpoints for HMS
  const endpoints = [
    { name: "Patient Search", endpointType: "PATIENT_SEARCH", httpMethod: "GET", path: "/patients/search" },
    { name: "Patient Details", endpointType: "PATIENT_DETAILS", httpMethod: "GET", path: "/patients/{id}" },
    { name: "Admission & Encounter", endpointType: "ENCOUNTER", httpMethod: "GET", path: "/encounters/{encounterNumber}" },
    { name: "Clinical Data", endpointType: "CLINICAL_DATA", httpMethod: "GET", path: "/clinical/{patientId}" }
  ];

  for (const ep of endpoints) {
    await prisma.hmsEndpoint.upsert({
      where: {
        hmsConnectionId_endpointType: {
          hmsConnectionId: hmsConn.id,
          endpointType: ep.endpointType
        }
      },
      update: {},
      create: {
        hmsConnectionId: hmsConn.id,
        name: ep.name,
        endpointType: ep.endpointType,
        httpMethod: ep.httpMethod,
        path: ep.path,
        active: true
      }
    });
  }

  // HMS Field Mappings
  const mappings = [
    { sourcePath: "patient.uhid", targetField: "patient.uhid", dataType: "STRING", isRequired: true },
    { sourcePath: "patient.name", targetField: "patient.fullName", dataType: "STRING", isRequired: true },
    { sourcePath: "patient.age", targetField: "patient.age", dataType: "NUMBER" },
    { sourcePath: "patient.gender", targetField: "patient.gender", dataType: "STRING" },
    { sourcePath: "admission.admission_date", targetField: "admission.admissionDate", dataType: "DATE" },
    { sourcePath: "admission.department", targetField: "admission.department", dataType: "STRING" },
    { sourcePath: "doctor.name", targetField: "attendingDoctor.name", dataType: "STRING" },
    { sourcePath: "diagnosis.primary", targetField: "clinical.diagnosis", dataType: "STRING" },
    { sourcePath: "medications.list", targetField: "clinical.medications", dataType: "ARRAY" },
    { sourcePath: "allergies.list", targetField: "clinical.allergies", dataType: "ARRAY" }
  ];

  for (const m of mappings) {
    await prisma.hmsFieldMapping.upsert({
      where: {
        hmsConnectionId_targetField: {
          hmsConnectionId: hmsConn.id,
          targetField: m.targetField
        }
      },
      update: {},
      create: {
        hmsConnectionId: hmsConn.id,
        sourcePath: m.sourcePath,
        targetField: m.targetField,
        dataType: m.dataType,
        isRequired: m.isRequired
      }
    });
  }

  // 9. Standard Summary Template
  const defaultSections = [
    {
      title: "Patient Demographics",
      order: 1,
      content: "<p><strong>Patient Name:</strong> {{patient.fullName}} &nbsp;|&nbsp; <strong>UHID:</strong> {{patient.uhid}} &nbsp;|&nbsp; <strong>Age/Gender:</strong> {{patient.age}} Yrs / {{patient.gender}}</p><p><strong>Contact:</strong> {{patient.phone}} &nbsp;|&nbsp; <strong>Address:</strong> {{patient.address}}</p>"
    },
    {
      title: "Admission & Encounter Details",
      order: 2,
      content: "<p><strong>Admission Date:</strong> {{admission.admissionDate}} &nbsp;|&nbsp; <strong>Discharge Date:</strong> {{admission.dischargeDate}}</p><p><strong>Department:</strong> {{admission.department}} &nbsp;|&nbsp; <strong>Attending Consultant:</strong> {{attendingDoctor.name}}</p>"
    },
    {
      title: "Final Diagnosis & Clinical Summary",
      order: 3,
      content: "<p><strong>Final Diagnosis:</strong></p><p class='clinical-highlight'>{{clinical.diagnosis}}</p><p><strong>Allergies:</strong> {{clinical.allergies}}</p>"
    },
    {
      title: "Hospital Course & Procedures",
      order: 4,
      content: "<p><strong>Procedures Performed:</strong> {{clinical.procedures}}</p><p>Patient was admitted under cardiology and treated conservatively with clinical stability attained.</p>"
    },
    {
      title: "Discharge Medications",
      order: 5,
      content: "<div class='medication-table'>{{clinical.medications}}</div>"
    },
    {
      title: "Condition at Discharge & Follow-up Instructions",
      order: 6,
      content: "<p><strong>Condition at Discharge:</strong> Hemodynamically Stable, Afebrile, Ambulatory.</p><p><strong>Follow-up Instructions:</strong> {{clinical.followUp}}</p>"
    }
  ];

  await prisma.summaryTemplate.upsert({
    where: {
      organizationId_code_version: {
        organizationId: org.id,
        code: "STD_DISCHARGE_V1",
        version: 1
      }
    },
    update: {},
    create: {
      organizationId: org.id,
      projectTypeId: dischargeProjType.id,
      name: "Standard Inpatient Discharge Summary",
      code: "STD_DISCHARGE_V1",
      description: "Official Amvion clinical discharge template v1.0",
      status: "APPROVED",
      version: 1,
      isDefault: true,
      sections: defaultSections,
      headerHtml: "<div class='header-bar'><h3>AMVION MEMORIAL HOSPITAL</h3><p>CLINICAL DISCHARGE SUMMARY</p></div>",
      footerHtml: "<div class='footer-bar'><p>Confidential Medical Document - For Medical Treatment Continuation Only</p></div>"
    }
  });

  // 10. Sample Patients and Tasks
  const patient1 = await prisma.patient.upsert({
    where: {
      organizationId_uhid: {
        organizationId: org.id,
        uhid: "UHID-2026-9011"
      }
    },
    update: {},
    create: {
      organizationId: org.id,
      hospitalId: hospital.id,
      externalId: "HMS-P-101",
      uhid: "UHID-2026-9011",
      firstName: "Robert",
      lastName: "Chen",
      fullName: "Robert Chen",
      dob: new Date("1968-05-14"),
      age: 58,
      gender: "MALE",
      phone: "+1-555-0143",
      email: "r.chen@example.com",
      address: "742 Evergreen Terrace, Metro City",
      bloodGroup: "B+",
      source: "HMS",
      dataClassification: "HIGHLY_SENSITIVE"
    }
  });

  const encounter1 = await prisma.encounter.upsert({
    where: {
      patientId_encounterNumber: {
        patientId: patient1.id,
        encounterNumber: "ENC-2026-081"
      }
    },
    update: {},
    create: {
      patientId: patient1.id,
      departmentId: cardiologyDept.id,
      encounterNumber: "ENC-2026-081",
      admissionDate: new Date("2026-10-10T08:30:00Z"),
      dischargeDate: new Date("2026-10-16T09:00:00Z"),
      encounterType: "INPATIENT",
      attendingDoctorName: "Dr. Arun Kumar, MD",
      roomNumber: "ICU-3",
      bedNumber: "Bed-A",
      status: "DISCHARGED"
    }
  });

  // Sample Task 1: HMS_AND_DOCUMENT
  await prisma.task.upsert({
    where: { taskNumber: "TSK-2026-0001" },
    update: {},
    create: {
      organizationId: org.id,
      projectId: project.id,
      projectTypeId: dischargeProjType.id,
      patientId: patient1.id,
      encounterId: encounter1.id,
      taskNumber: "TSK-2026-0001",
      dataSource: "HMS_AND_DOCUMENT",
      status: "READY_FOR_REVIEW",
      assignedUserId: doctorUser.id,
      reviewerUserId: adminUser.id,
      createdById: adminUser.id,
      unifiedClinicalData: {
        patient: {
          fullName: "Robert Chen",
          uhid: "UHID-2026-9011",
          age: 58,
          gender: "MALE",
          phone: "+1-555-0143",
          address: "742 Evergreen Terrace, Metro City"
        },
        admission: {
          admissionDate: "2026-10-10",
          dischargeDate: "2026-10-16",
          department: "Cardiology Department",
          room: "ICU-3 / Bed-A"
        },
        attendingDoctor: {
          name: "Dr. Arun Kumar, MD"
        },
        clinical: {
          diagnosis: "Acute Coronary Syndrome, Non-ST Elevation Myocardial Infarction (NSTEMI)",
          allergies: "NKDA (No Known Drug Allergies)",
          procedures: "Coronary Angiography with Drug-Eluting Stent (DES) to proximal LAD",
          medications: [
            "Aspirin 81mg orally once daily",
            "Ticagrelor 90mg orally twice daily for 12 months",
            "Atorvastatin 80mg orally at bedtime",
            "Metoprolol Succinate 50mg orally once daily",
            "Ramipril 5mg orally once daily"
          ],
          followUp: "Cardiology outpatient clinic review in 10 days with repeat lipid profile and ECG."
        }
      }
    }
  });

  // Seed System Settings
  const settings = [
    { category: "AI", key: "PROVIDER", value: "DETERMINISTIC_FASTAPI_LLM" },
    { category: "AI", key: "CONFIDENCE_THRESHOLD", value: "0.85" },
    { category: "OCR", key: "ENGINE", value: "PDFPLUMBER_TESSERACT" },
    { category: "WORKFLOW", key: "STRICT_APPROVAL_REQUIRED", value: "true" },
    { category: "SECURITY", key: "SESSION_TIMEOUT_MINUTES", value: "60" }
  ];

  for (const s of settings) {
    await prisma.systemSetting.upsert({
      where: {
        organizationId_category_key: {
          organizationId: org.id,
          category: s.category,
          key: s.key
        }
      },
      update: {},
      create: {
        organizationId: org.id,
        category: s.category,
        key: s.key,
        value: s.value
      }
    });
  }

  console.log("Database seeded successfully with Amvion Healthcare Systems!");
}

if (process.argv[1].endsWith("seed.ts")) {
  seedDatabase()
    .catch((err) => {
      console.error("Seeding failed:", err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

