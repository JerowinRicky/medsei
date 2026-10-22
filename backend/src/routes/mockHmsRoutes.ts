import { Router, Request, Response } from "express";

const router = Router();

// In-memory mock patient database for the simulated hospital HMS
const mockPatients = [
  {
    uhid: "UHID-2026-9011",
    patient_id: "HMS-P-101",
    name: "Robert Chen",
    dob: "1968-05-14",
    age: 58,
    gender: "Male",
    phone: "+1-555-0143",
    email: "r.chen@example.com",
    address: "742 Evergreen Terrace, Metro City",
    bloodGroup: "B+",
    admission: {
      encounter_number: "ENC-2026-081",
      admission_date: "2026-10-10",
      discharge_date: "2026-10-16",
      department: "Cardiology",
      room: "ICU-3 / Bed-A"
    },
    doctor: {
      name: "Dr. Arun Kumar, MD FACC"
    },
    diagnosis: {
      primary: "Acute Coronary Syndrome, Non-ST Elevation Myocardial Infarction (NSTEMI)",
      icd10: "I21.4"
    },
    allergies: {
      list: ["NKDA (No Known Drug Allergies)"]
    },
    procedures: {
      primary: "Coronary Angiography and successful Drug-Eluting Stent (DES) to proximal LAD"
    },
    medications: {
      list: [
        "Aspirin 81mg orally once daily",
        "Ticagrelor 90mg orally twice daily",
        "Atorvastatin 80mg orally at bedtime",
        "Metoprolol Succinate 50mg orally once daily",
        "Ramipril 5mg orally once daily"
      ]
    },
    follow_up: {
      instructions: "Cardiology outpatient follow-up in 10 days with repeat lipid profile and ECG. Strict low-sodium, heart-healthy diet."
    }
  },
  {
    uhid: "UHID-2026-4420",
    patient_id: "HMS-P-102",
    name: "Eleanor Vance",
    dob: "1982-11-03",
    age: 43,
    gender: "Female",
    phone: "+1-555-0872",
    email: "e.vance@example.com",
    address: "124 Hillside Avenue, Metro City",
    bloodGroup: "O+",
    admission: {
      encounter_number: "ENC-2026-094",
      admission_date: "2026-10-12",
      discharge_date: "2026-10-16",
      department: "General Internal Medicine",
      room: "Ward-4 / Bed-12"
    },
    doctor: {
      name: "Dr. Sarah Jenkins, MD"
    },
    diagnosis: {
      primary: "Community-Acquired Bacterial Pneumonia with Right Lower Lobe Infiltration",
      icd10: "J18.9"
    },
    allergies: {
      list: ["Penicillin (Hives / Rash)"]
    },
    procedures: {
      primary: "Chest X-ray PA View, Sputum Culture, IV Antibiotic Therapy"
    },
    medications: {
      list: [
        "Levofloxacin 500mg orally once daily for 5 more days",
        "Paracetamol 650mg orally as needed for fever",
        "Guaifenesin 400mg orally every 8 hours as needed"
      ]
    },
    follow_up: {
      instructions: "Follow up with internal medicine in 14 days with repeat Chest X-Ray. Complete full antibiotic course."
    }
  },
  {
    uhid: "UHID-2026-7731",
    patient_id: "HMS-P-103",
    name: "Marcus Brody",
    dob: "1954-03-29",
    age: 72,
    gender: "Male",
    phone: "+1-555-0329",
    email: "m.brody@example.com",
    address: "88 University Crescent, Metro City",
    bloodGroup: "A+",
    admission: {
      encounter_number: "ENC-2026-102",
      admission_date: "2026-10-13",
      discharge_date: "2026-10-16",
      department: "Gastroenterology",
      room: "Endoscopy Unit / Bed-2"
    },
    doctor: {
      name: "Dr. Michael Chang, MD"
    },
    diagnosis: {
      primary: "Acute Diverticulitis without Perforation, Sigmoid Colon",
      icd10: "K57.32"
    },
    allergies: {
      list: ["Sulfa drugs (Stevens-Johnson syndrome risk)"]
    },
    procedures: {
      primary: "Abdominal CT Scan, Diagnostic Bowel Rest and IV Hydration"
    },
    medications: {
      list: [
        "Ciprofloxacin 500mg orally twice daily for 7 days",
        "Metronidazole 500mg orally three times daily for 7 days",
        "Dicyclomine 20mg orally before meals as needed"
      ]
    },
    follow_up: {
      instructions: "High-fiber dietary transition after acute phase. Colonoscopy scheduled in 6 weeks."
    }
  }
];

// 1. Patient Search
router.get("/patients/search", (req: Request, res: Response) => {
  const query = (req.query.q as string || "").toLowerCase();
  const results = mockPatients.filter(p => 
    p.name.toLowerCase().includes(query) ||
    p.uhid.toLowerCase().includes(query) ||
    p.patient_id.toLowerCase().includes(query) ||
    p.admission.encounter_number.toLowerCase().includes(query)
  );

  res.json({
    success: true,
    data: results.map(p => ({
      uhid: p.uhid,
      patientId: p.patient_id,
      name: p.name,
      age: p.age,
      gender: p.gender,
      department: p.admission.department,
      encounterNumber: p.admission.encounter_number,
      admissionDate: p.admission.admission_date,
      doctor: p.doctor.name
    }))
  });
});

// 2. Patient Details
router.get("/patients/:uhid", (req: Request, res: Response) => {
  const { uhid } = req.params;
  const patient = mockPatients.find(p => p.uhid.toLowerCase() === uhid.toLowerCase() || p.patient_id.toLowerCase() === uhid.toLowerCase());
  if (!patient) {
    res.status(404).json({ success: false, error: { message: "Patient record not found in HMS" } });
    return;
  }
  res.json({ success: true, data: patient });
});

// 3. Clinical Data
router.get("/clinical/:uhid", (req: Request, res: Response) => {
  const { uhid } = req.params;
  const patient = mockPatients.find(p => p.uhid.toLowerCase() === uhid.toLowerCase() || p.patient_id.toLowerCase() === uhid.toLowerCase());
  if (!patient) {
    res.status(404).json({ success: false, error: { message: "Clinical records not found in HMS" } });
    return;
  }
  res.json({ success: true, data: patient });
});

export default router;

