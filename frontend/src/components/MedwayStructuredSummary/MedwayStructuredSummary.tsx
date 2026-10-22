// src/components/MedwayStructuredSummary.tsx
import React, { useState, useEffect } from 'react';
import { Edit3, Save, X, Maximize2, Plus, Trash2 } from 'lucide-react';
import clsx from 'clsx';

export interface MedwayStructuredData {
  ip_no: string;
  uhid: string;
  doa: string;
  dod: string;
  room_no: string;
  patient_name: string;
  age_gender: string;
  consultant_name: string;
  consultant_name_short: string;
  consultant_specialization: string;
  diagnosis: string;
  present_complaints: string;
  known_case: string;
  sp: string;
  drug_allergy: string;
  vitals: {
    temp: string;
    cbg: string;
    pr: string;
    bp: string;
    rr: string;
    spo2: string;
  };
  examination: {
    cvs: string;
    rs: string;
    abdomen: string;
    cns: string;
    le: string;
  };
  le: string;
  treatment: string;
  hospital_course: string;
  medications: Array<{
    name: string;
    strength: string;
    dose_count: string;
    morning: string;
    afternoon: string;
    night: string;
    route: string;
    relation: string;
    duration: string;
  }>;
  discharge: {
    gcs: string;
    temp: string;
    bp: string;
    pr: string;
    spo2: string;
  };
  discharge_advice_items: string[];
  review: string;
  review_days: string;
  typed_by: string;
}

interface Props {
  data: MedwayStructuredData;
  onSave?: (data: MedwayStructuredData) => void;
  readOnly?: boolean;
}

export function MedwayStructuredSummary({ data, onSave, readOnly = false }: Props) {
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState(data);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    setEditData(data);
  }, [data]);

  const stripUnits = (val?: string) => {
    if (!val) return '';
    return String(val).replace(/(°F|mmHg|mg\/dl|\/min|%|bpm)$/gi, '').trim();
  };

  const safe = (val?: string, fb: string = '—') => {
    return (val && String(val).trim()) ? String(val).trim() : fb;
  };

  const updateField = (path: (string | number)[], value: any) => {
    const newData = { ...editData };
    let current: any = newData;
    for (let i = 0; i < path.length - 1; i++) {
      if (!current[path[i]]) current[path[i]] = {};
      current = current[path[i]];
    }
    current[path[path.length - 1]] = value;
    setEditData(newData);
  };

  const addMedication = () => {
    setEditData({
      ...editData,
      medications: [...editData.medications, {
        name: '', strength: '', dose_count: '1 Tablet', morning: '', afternoon: '', night: '', route: 'Per oral', relation: 'After food', duration: ''
      }]
    });
  };

  const removeMedication = (idx: number) => {
    const newMeds = editData.medications.filter((_, i) => i !== idx);
    setEditData({ ...editData, medications: newMeds });
  };

  const addAdvice = () => {
    setEditData({
      ...editData,
      discharge_advice_items: [...editData.discharge_advice_items, '']
    });
  };

  const removeAdvice = (idx: number) => {
    const newItems = editData.discharge_advice_items.filter((_, i) => i !== idx);
    setEditData({ ...editData, discharge_advice_items: newItems });
  };

  const handleSave = () => {
    onSave?.(editData);
    setEditMode(false);
  };

  const EditableSpan = ({
    value,
    path,
    className = '',
    style,
    fb = '—',
  }: {
    value?: string;
    path: (string | number)[];
    className?: string;
    style?: React.CSSProperties;
    fb?: string;
  }) => {
    if (editMode && !readOnly) {
      return (
        <input
          type="text"
          value={value || ''}
          onChange={(e) => updateField(path, e.target.value)}
          className={clsx("px-1 py-0.5 border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white", className)}
          style={{ minWidth: '60px', ...style }}
        />
      );
    }
    return <span className={className} style={style}>{value || fb}</span>;
  };

  const EditableBlock = ({
    value,
    path,
    className = '',
    style,
    fb = '—',
  }: {
    value?: string;
    path: (string | number)[];
    className?: string;
    style?: React.CSSProperties;
    fb?: string;
  }) => {
    if (editMode && !readOnly) {
      return (
        <textarea
          value={value || ''}
          onChange={(e) => updateField(path, e.target.value)}
          className={clsx("w-full px-2 py-1 border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white", className)}
          rows={3}
          style={style}
        />
      );
    }
    return <div className={className} style={style}>{value || fb}</div>;
  };

  // Hospital Header Component
  const HospitalHeader = () => (
    <div className="hh" style={{ textAlign: 'center', padding: '14px 0 10px', borderBottom: '2.5px solid #1a3a6b', marginBottom: '10px' }}>
      <div className="hh-name" style={{ fontSize: '22px', fontWeight: 700, color: '#1a3a6b', letterSpacing: '1px', fontFamily: "'Crimson Pro', serif" }}>
        <EditableSpan value={editData.consultant_name ? "Medway Hospitals" : "Medway Hospitals"} path={['hospital_name']} />
      </div>
      <div className="hh-tag" style={{ fontSize: '11px', color: '#4a7c2f', fontStyle: 'italic', fontWeight: 600 }}>The way to better health</div>
      <div className="hh-unit" style={{ fontSize: '10px', color: '#999' }}>(A Unit of United Alliance Healthcare Pvt Ltd)</div>
      <div className="hh-dept" style={{ fontSize: '10.5px', color: '#1a3a6b', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginTop: '3px' }}>Medical Records Department</div>
      <div className="hh-title" style={{ fontSize: '15px', fontWeight: 700, letterSpacing: '3px', color: '#4a7c2f', textTransform: 'uppercase', marginTop: '6px' }}>Discharge Summary</div>
    </div>
  );

  const SummaryContent = () => (
    <div style={{ fontFamily: "'Crimson Pro', 'Times New Roman', serif", fontSize: '13.5px', lineHeight: 1.45, color: '#111', background: '#fff' }}>
      {/* PAGE 1 */}
      <div className="doc-page" style={{ position: 'relative', padding: '32px 48px 40px' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '5px', background: 'linear-gradient(90deg, #1a3a6b, #4a7c2f, #1a3a6b)', borderRadius: '3px 3px 0 0' }}></div>
        <div style={{ position: 'absolute', top: '11px', right: '13px', background: '#1a3a6b', color: '#fff', fontSize: '9px', fontWeight: 700, padding: '2px 8px', borderRadius: '10px', letterSpacing: '0.5px', fontFamily: "'DM Sans', sans-serif" }}>PAGE 1 OF 3</div>
        
        <HospitalHeader />

        {/* Patient Info Grid */}
        <div className="igrid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', border: '1.5px solid #b8cfe0', borderRadius: '5px', overflow: 'hidden', marginTop: '10px', fontSize: '13px' }}>
          <div className="ic" style={{ padding: '5px 10px', display: 'flex', gap: '5px', alignItems: 'center', borderBottom: '1px solid #dde8f5', borderRight: '1px solid #dde8f5', background: '#f5f8f2' }}>
            <span className="ik" style={{ fontWeight: 700, minWidth: '82px', color: '#1a3a6b', fontSize: '12.5px', flexShrink: 0 }}>IP No.</span>
            <EditableSpan value={editData.ip_no} path={['ip_no']} className="iv" style={{ fontWeight: 600 }} />
          </div>
          <div className="ic" style={{ padding: '5px 10px', display: 'flex', gap: '5px', alignItems: 'center', borderBottom: '1px solid #dde8f5', background: '#f5f8f2' }}>
            <span className="ik" style={{ fontWeight: 700, minWidth: '82px', color: '#1a3a6b', fontSize: '12.5px', flexShrink: 0 }}>D.O.A</span>
            <EditableSpan value={editData.doa} path={['doa']} className="iv" style={{ fontWeight: 600 }} />
          </div>
          <div className="ic" style={{ padding: '5px 10px', display: 'flex', gap: '5px', alignItems: 'center', borderBottom: '1px solid #dde8f5', borderRight: '1px solid #dde8f5' }}>
            <span className="ik" style={{ fontWeight: 700, minWidth: '82px', color: '#1a3a6b', fontSize: '12.5px', flexShrink: 0 }}>UHID</span>
            <EditableSpan value={editData.uhid} path={['uhid']} className="iv" style={{ fontWeight: 600 }} />
          </div>
          <div className="ic" style={{ padding: '5px 10px', display: 'flex', gap: '5px', alignItems: 'center', borderBottom: '1px solid #dde8f5' }}>
            <span className="ik" style={{ fontWeight: 700, minWidth: '82px', color: '#1a3a6b', fontSize: '12.5px', flexShrink: 0 }}>D.O.D</span>
            <EditableSpan value={editData.dod} path={['dod']} className="iv" style={{ fontWeight: 600 }} />
          </div>
          <div className="ic" style={{ padding: '5px 10px', display: 'flex', gap: '5px', alignItems: 'center', borderBottom: '1px solid #dde8f5', borderRight: '1px solid #dde8f5', background: '#f5f8f2' }}>
            <span className="ik" style={{ fontWeight: 700, minWidth: '82px', color: '#1a3a6b', fontSize: '12.5px', flexShrink: 0 }}>Patient Name</span>
            <EditableSpan value={editData.patient_name} path={['patient_name']} className="iv" style={{ fontWeight: 600 }} />
          </div>
          <div className="ic" style={{ padding: '5px 10px', display: 'flex', gap: '5px', alignItems: 'center', borderBottom: '1px solid #dde8f5', background: '#f5f8f2' }}>
            <span className="ik" style={{ fontWeight: 700, minWidth: '82px', color: '#1a3a6b', fontSize: '12.5px', flexShrink: 0 }}>Room No.</span>
            <EditableSpan value={editData.room_no} path={['room_no']} className="iv" style={{ fontWeight: 600 }} />
          </div>
          <div className="ic full" style={{ gridColumn: '1/-1', padding: '5px 10px', display: 'flex', gap: '5px', alignItems: 'center', borderBottom: '1px solid #dde8f5', background: '#eef4f0' }}>
            <span className="ik" style={{ fontWeight: 700, minWidth: '82px', color: '#1a3a6b', fontSize: '12.5px', flexShrink: 0 }}>Age / Gender</span>
            <EditableSpan value={editData.age_gender} path={['age_gender']} className="iv" style={{ fontWeight: 600 }} />
          </div>
          <div className="ic full" style={{ gridColumn: '1/-1', padding: '5px 10px', display: 'flex', gap: '5px', alignItems: 'center', background: '#eef4f0' }}>
            <span className="ik" style={{ fontWeight: 700, minWidth: '82px', color: '#1a3a6b', fontSize: '12.5px', flexShrink: 0 }}>Consultant</span>
            <div>
              <EditableSpan value={editData.consultant_name} path={['consultant_name']} className="iv" style={{ fontWeight: 600 }} />
              {editData.consultant_specialization && (
                <span style={{ fontWeight: 400, color: '#555', fontSize: '12px', marginLeft: '4px' }}>({editData.consultant_specialization})</span>
              )}
            </div>
          </div>
        </div>

        {/* Diagnosis */}
        <div className="sec" style={{ marginTop: '12px' }}>
          <div className="sh" style={{ fontWeight: 700, fontSize: '12.5px', color: '#1a3a6b', textTransform: 'uppercase', letterSpacing: '0.4px', padding: '3px 0 3px 8px', borderLeft: '3px solid #4a7c2f', marginBottom: '5px', background: 'linear-gradient(90deg, #f5f8f2, transparent)' }}>Diagnosis</div>
          <div className="sb" style={{ fontSize: '13px', paddingLeft: '4px', lineHeight: 1.55 }}>
            <div className="dia" style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginTop: '2px' }}>
              <span className="di" style={{ color: '#1a3a6b', fontSize: '10px', marginTop: '3px', flexShrink: 0 }}>❖</span>
              <EditableBlock value={editData.diagnosis} path={['diagnosis']} />
            </div>
          </div>
        </div>

        {/* Present Complaints */}
        <div className="sec" style={{ marginTop: '12px' }}>
          <div className="sh" style={{ fontWeight: 700, fontSize: '12.5px', color: '#1a3a6b', textTransform: 'uppercase', letterSpacing: '0.4px', padding: '3px 0 3px 8px', borderLeft: '3px solid #4a7c2f', marginBottom: '5px', background: 'linear-gradient(90deg, #f5f8f2, transparent)' }}>Present Complaints</div>
          <div className="sb" style={{ fontSize: '13px', paddingLeft: '4px', lineHeight: 1.55 }}>
            <EditableBlock value={editData.present_complaints} path={['present_complaints']} />
            <br /><br />Now admitted here for further management
          </div>
        </div>

        {/* Past History */}
        <div className="sec" style={{ marginTop: '12px' }}>
          <div className="sh" style={{ fontWeight: 700, fontSize: '12.5px', color: '#1a3a6b', textTransform: 'uppercase', letterSpacing: '0.4px', padding: '3px 0 3px 8px', borderLeft: '3px solid #4a7c2f', marginBottom: '5px', background: 'linear-gradient(90deg, #f5f8f2, transparent)' }}>Past History</div>
          <div className="sb" style={{ fontSize: '13px', paddingLeft: '4px', lineHeight: 1.55 }}>
            {editData.known_case && <div>Known case of <EditableSpan value={editData.known_case} path={['known_case']} /><br /></div>}
            {editData.sp && <div>S/P <EditableSpan value={editData.sp} path={['sp']} /><br /></div>}
            <span className="red" style={{ color: '#b91c1c' }}>Not a known case of DM / HTN / CAD / CVA / BA / Kidney disorder / TB / Seizure Disorder</span>
          </div>
        </div>

        {/* Drug Allergy */}
        <div className="sec" style={{ marginTop: '12px' }}>
          <div className="sh" style={{ fontWeight: 700, fontSize: '12.5px', color: '#1a3a6b', textTransform: 'uppercase', letterSpacing: '0.4px', padding: '3px 0 3px 8px', borderLeft: '3px solid #4a7c2f', marginBottom: '5px', background: 'linear-gradient(90deg, #f5f8f2, transparent)' }}>Drug Allergy</div>
          <div className="sb" style={{ fontSize: '13px', paddingLeft: '4px', lineHeight: 1.55 }}>
            <EditableSpan value={editData.drug_allergy} path={['drug_allergy']} fb="Not Known Drug allergy" />
          </div>
        </div>

        {/* On Examination */}
        <div className="sec" style={{ marginTop: '12px' }}>
          <div className="sh" style={{ fontWeight: 700, fontSize: '12.5px', color: '#1a3a6b', textTransform: 'uppercase', letterSpacing: '0.4px', padding: '3px 0 3px 8px', borderLeft: '3px solid #4a7c2f', marginBottom: '5px', background: 'linear-gradient(90deg, #f5f8f2, transparent)' }}>On Examination</div>
          <div className="sb" style={{ fontSize: '13px', paddingLeft: '4px', lineHeight: 1.55 }}>
            Patient Conscious / Oriented / Afebrile
            <table className="vt" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '7px', fontSize: '13px' }}>
              <tbody>
                <tr><td className="vl" style={{ fontWeight: 600, color: '#333', width: '95px' }}>Temperature</td><td className="vd" style={{ width: '14px', color: '#aaa', textAlign: 'center' }}>-</td><td className="vv" style={{ color: '#111', width: '140px' }}><EditableSpan value={stripUnits(editData.vitals.temp)} path={['vitals', 'temp']} />°F</td>
                    <td className="vl" style={{ fontWeight: 600, color: '#333', width: '95px' }}>CBG</td><td className="vd" style={{ width: '14px', color: '#aaa', textAlign: 'center' }}>-</td><td className="vv" style={{ color: '#111', width: '140px' }}><EditableSpan value={stripUnits(editData.vitals.cbg)} path={['vitals', 'cbg']} /> mg/dl</td></tr>
                <tr><td className="vl">PR</td><td className="vd">-</td><td className="vv"><EditableSpan value={stripUnits(editData.vitals.pr)} path={['vitals', 'pr']} />/min</td>
                    <td className="vl">BP</td><td className="vd">-</td><td className="vv"><EditableSpan value={stripUnits(editData.vitals.bp)} path={['vitals', 'bp']} /> mmHg</td></tr>
                <tr><td className="vl">RR</td><td className="vd">-</td><td className="vv"><EditableSpan value={stripUnits(editData.vitals.rr)} path={['vitals', 'rr']} />/min</td>
                    <td className="vl">SPO2</td><td className="vd">-</td><td className="vv"><EditableSpan value={stripUnits(editData.vitals.spo2)} path={['vitals', 'spo2']} />% in room air</td></tr>
                <tr><td className="vl">CVS</td><td className="vd">-</td><td className="vv"><EditableSpan value={editData.examination.cvs} path={['examination', 'cvs']} fb="S1S2 (+)" /></td>
                    <td className="vl">RS</td><td className="vd">-</td><td className="vv"><EditableSpan value={editData.examination.rs} path={['examination', 'rs']} fb="BAE (+)" /></td></tr>
                <tr><td className="vl">Abdomen</td><td className="vd">-</td><td className="vv"><EditableSpan value={editData.examination.abdomen} path={['examination', 'abdomen']} fb="Soft, BS (+)" /></td>
                    <td className="vl">CNS</td><td className="vd">-</td><td className="vv"><EditableSpan value={editData.examination.cns} path={['examination', 'cns']} fb="NFND" /></td></tr>
                <tr><td className="vl">L/E</td><td className="vd">-</td><td className="vv" colSpan={3}><EditableSpan value={editData.examination.le || editData.le} path={['examination', 'le']} /></td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* PAGE 2 */}
      <div className="doc-page" style={{ position: 'relative', padding: '32px 48px 40px', marginTop: '20px' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '5px', background: 'linear-gradient(90deg, #1a3a6b, #4a7c2f, #1a3a6b)', borderRadius: '3px 3px 0 0' }}></div>
        <div style={{ position: 'absolute', top: '11px', right: '13px', background: '#1a3a6b', color: '#fff', fontSize: '9px', fontWeight: 700, padding: '2px 8px', borderRadius: '10px', fontFamily: "'DM Sans', sans-serif" }}>PAGE 2 OF 3</div>
        
        {/* <HospitalHeader /> */}

        <div className="sec" style={{ marginTop: '12px' }}>
          <div className="sh" style={{ fontWeight: 700, fontSize: '12.5px', color: '#1a3a6b', textTransform: 'uppercase', letterSpacing: '0.4px', padding: '3px 0 3px 8px', borderLeft: '3px solid #4a7c2f', marginBottom: '5px', background: 'linear-gradient(90deg, #f5f8f2, transparent)' }}>Investigations</div>
          <div className="sb" style={{ fontSize: '13px', paddingLeft: '4px' }}>Enclosed</div>
        </div>

        <div className="sec" style={{ marginTop: '12px' }}>
          <div className="sh" style={{ fontWeight: 700, fontSize: '12.5px', color: '#1a3a6b', textTransform: 'uppercase', letterSpacing: '0.4px', padding: '3px 0 3px 8px', borderLeft: '3px solid #4a7c2f', marginBottom: '5px', background: 'linear-gradient(90deg, #f5f8f2, transparent)' }}>Treatment Given</div>
          <div className="sb" style={{ fontSize: '13px', paddingLeft: '4px' }}>
            <EditableSpan value={editData.treatment} path={['treatment']} fb="IV Fluids," />
          </div>
        </div>

        <div className="sec" style={{ marginTop: '12px' }}>
          <div className="sh" style={{ fontWeight: 700, fontSize: '12.5px', color: '#1a3a6b', textTransform: 'uppercase', letterSpacing: '0.4px', padding: '3px 0 3px 8px', borderLeft: '3px solid #4a7c2f', marginBottom: '5px', background: 'linear-gradient(90deg, #f5f8f2, transparent)' }}>Course in the Hospital</div>
          <div className="sb" style={{ fontSize: '13px', paddingLeft: '4px', textAlign: 'justify' }}>
            <EditableBlock value={editData.hospital_course || `${editData.age_gender || '___'}, ${editData.patient_name || 'Patient'}, Known case of ${editData.known_case || '—'}, Presented to Emergency Room with complaints of ${editData.present_complaints || '—'}<br/><br/>Now admitted here for further management. Patient got admitted under ${editData.consultant_name || 'Dr. T. Palaniappan'}. Baseline investigations were taken.<br/><br/>Strict vitals, glycemic levels, input and output were monitored. Patient was treated with IV fluids, antibiotics, PPI's, anti-emetics, analgesics, cardio protective drugs, nebulized bronchodilators and other supportive measures. Vitals are stable. Patient mobilized. Patient discharged with stable condition.`} path={['hospital_course']} />
          </div>
        </div>

        {/* Medications Table */}
        <div className="sec" style={{ marginTop: '12px' }}>
          <div className="sh" style={{ fontWeight: 700, fontSize: '12.5px', color: '#1a3a6b', textTransform: 'uppercase', letterSpacing: '0.4px', padding: '3px 0 3px 8px', borderLeft: '3px solid #4a7c2f', marginBottom: '5px', background: 'linear-gradient(90deg, #f5f8f2, transparent)' }}>Advice Medications</div>
          <table className="mt" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '8px', fontSize: '11.5px' }}>
            <thead>
              <tr style={{ background: '#1a3a6b', color: '#fff' }}>
                <th rowSpan={2} style={{ border: '1px solid #1a3a6b', padding: '6px 4px', width: '25px' }}>Sl<br/>No</th>
                <th rowSpan={2} className="tl" style={{ border: '1px solid #1a3a6b', padding: '6px 4px', textAlign: 'left', paddingLeft: '6px', width: '165px' }}>Name of the Drugs<br/><span style={{ fontWeight: 400, fontSize: '9.5px' }}>(Generic Name)</span></th>
                <th rowSpan={2} style={{ border: '1px solid #1a3a6b', padding: '6px 4px', width: '58px' }}>Strength</th>
                <th rowSpan={2} style={{ border: '1px solid #1a3a6b', padding: '6px 4px', width: '62px' }}>Dosage</th>
                <th colSpan={3} style={{ border: '1px solid #1a3a6b', padding: '6px 4px' }}>Frequency</th>
                <th rowSpan={2} style={{ border: '1px solid #1a3a6b', padding: '6px 4px', width: '54px' }}>Route</th>
                <th rowSpan={2} style={{ border: '1px solid #1a3a6b', padding: '6px 4px', width: '70px' }}>Relation With Meal</th>
                <th rowSpan={2} style={{ border: '1px solid #1a3a6b', padding: '6px 4px', width: '52px' }}>Duration</th>
                {editMode && <th rowSpan={2} style={{ border: '1px solid #1a3a6b', padding: '6px 4px', width: '30px' }}>Del</th>}
              </tr>
              <tr style={{ background: '#1a3a6b', color: '#fff' }}>
                <th style={{ border: '1px solid #1a3a6b', padding: '6px 4px', width: '25px' }}>M</th>
                <th style={{ border: '1px solid #1a3a6b', padding: '6px 4px', width: '25px' }}>A</th>
                <th style={{ border: '1px solid #1a3a6b', padding: '6px 4px', width: '25px' }}>N</th>
              </tr>
            </thead>
            <tbody>
              {editData.medications.map((med, idx) => (
                <tr key={idx} style={{ border: '1px solid #c0cfe0' }}>
                  <td className="sn" style={{ border: '1px solid #c0cfe0', padding: '5px 4px', textAlign: 'center', width: '25px', color: '#1a3a6b', fontWeight: 700 }}>{idx + 1}</td>
                  <td style={{ border: '1px solid #c0cfe0', padding: '5px 4px', verticalAlign: 'top', color: '#111' }}><EditableSpan value={med.name} path={['medications', idx, 'name']} /></td>
                  <td className="c" style={{ border: '1px solid #c0cfe0', padding: '5px 4px', textAlign: 'center', verticalAlign: 'top', color: '#111' }}><EditableSpan value={med.strength} path={['medications', idx, 'strength']} /></td>
                  <td className="c" style={{ border: '1px solid #c0cfe0', padding: '5px 4px', textAlign: 'center', verticalAlign: 'top', color: '#111' }}><EditableSpan value={med.dose_count} path={['medications', idx, 'dose_count']} fb="1 Tablet" /></td>
                  <td className="c" style={{ border: '1px solid #c0cfe0', padding: '5px 4px', textAlign: 'center', verticalAlign: 'top', color: '#111' }}><EditableSpan value={med.morning} path={['medications', idx, 'morning']} /></td>
                  <td className="c" style={{ border: '1px solid #c0cfe0', padding: '5px 4px', textAlign: 'center', verticalAlign: 'top', color: '#111' }}><EditableSpan value={med.afternoon} path={['medications', idx, 'afternoon']} /></td>
                  <td className="c" style={{ border: '1px solid #c0cfe0', padding: '5px 4px', textAlign: 'center', verticalAlign: 'top', color: '#111' }}><EditableSpan value={med.night} path={['medications', idx, 'night']} /></td>
                  <td className="c" style={{ border: '1px solid #c0cfe0', padding: '5px 4px', textAlign: 'center', verticalAlign: 'top', color: '#111' }}><EditableSpan value={med.route} path={['medications', idx, 'route']} fb="Per oral" /></td>
                  <td className="c" style={{ border: '1px solid #c0cfe0', padding: '5px 4px', textAlign: 'center', verticalAlign: 'top', color: '#111' }}><EditableSpan value={med.relation} path={['medications', idx, 'relation']} fb="After food" /></td>
                  <td className="c" style={{ border: '1px solid #c0cfe0', padding: '5px 4px', textAlign: 'center', verticalAlign: 'top', color: '#111' }}><EditableSpan value={med.duration} path={['medications', idx, 'duration']} /></td>
                  {editMode && (
                    <td className="c" style={{ border: '1px solid #c0cfe0', padding: '5px 4px', textAlign: 'center' }}>
                      <button onClick={() => removeMedication(idx)} className="text-red-500 hover:text-red-700">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {editMode && (
            <button onClick={addMedication} className="add-med-btn" style={{ width: '100%', marginTop: '7px', padding: '7px', background: '#f5f8f2', border: '1.5px dashed #1a3a6b', borderRadius: '6px', color: '#1a3a6b', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
              <Plus className="h-3 w-3" /> Add Medication Row
            </button>
          )}
        </div>

        {/* Alert Box */}
        <div className="alrt" style={{ background: '#f0f7ed', border: '1px solid #4a7c2f', borderRadius: '5px', padding: '8px 11px', fontSize: '12.5px', marginTop: '10px', color: '#333' }}>
          <b style={{ color: '#2d5a1a' }}>⚠ To report:</b> If temp &gt; 101°F / Difficulty in breathing / Headache / Giddiness / Persistent vomiting / loose stools.<br />
          <b style={{ color: '#2d5a1a' }}>In case of emergency contact:</b> Medway Hospitals @ 2473 4455
        </div>
      </div>

      {/* PAGE 3 */}
      <div className="doc-page" style={{ position: 'relative', padding: '32px 48px 40px', marginTop: '20px' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '5px', background: 'linear-gradient(90deg, #1a3a6b, #4a7c2f, #1a3a6b)', borderRadius: '3px 3px 0 0' }}></div>
        <div style={{ position: 'absolute', top: '11px', right: '13px', background: '#1a3a6b', color: '#fff', fontSize: '9px', fontWeight: 700, padding: '2px 8px', borderRadius: '10px', fontFamily: "'DM Sans', sans-serif" }}>PAGE 3 OF 3</div>
        
        {/* <HospitalHeader /> */}

        {/* Condition on Discharge */}
        <div className="sec" style={{ marginTop: '12px' }}>
          <div className="sh" style={{ fontWeight: 700, fontSize: '12.5px', color: '#1a3a6b', textTransform: 'uppercase', letterSpacing: '0.4px', padding: '3px 0 3px 8px', borderLeft: '3px solid #4a7c2f', marginBottom: '5px', background: 'linear-gradient(90deg, #f5f8f2, transparent)' }}>Condition on Discharge</div>
          <div className="dchips" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '5px', marginTop: '6px' }}>
            <div className="dc" style={{ background: '#f5f8f2', border: '1px solid #c0d4b0', borderRadius: '5px', padding: '5px 9px', textAlign: 'center' }}>
              <span className="dck" style={{ fontWeight: 700, color: '#1a3a6b', fontSize: '10.5px', display: 'block' }}>GCS</span>
              <EditableSpan value={editData.discharge.gcs} path={['discharge', 'gcs']} fb="15/15" className="dcv" style={{ fontWeight: 600, fontSize: '13px' }} />
            </div>
            <div className="dc" style={{ background: '#f5f8f2', border: '1px solid #c0d4b0', borderRadius: '5px', padding: '5px 9px', textAlign: 'center' }}>
              <span className="dck" style={{ fontWeight: 700, color: '#1a3a6b', fontSize: '10.5px', display: 'block' }}>Temperature</span>
              <EditableSpan value={stripUnits(editData.discharge.temp)} path={['discharge', 'temp']} fb="98.6" className="dcv" style={{ fontWeight: 600, fontSize: '13px' }} />°F
            </div>
            <div className="dc" style={{ background: '#f5f8f2', border: '1px solid #c0d4b0', borderRadius: '5px', padding: '5px 9px', textAlign: 'center' }}>
              <span className="dck" style={{ fontWeight: 700, color: '#1a3a6b', fontSize: '10.5px', display: 'block' }}>BP</span>
              <EditableSpan value={stripUnits(editData.discharge.bp)} path={['discharge', 'bp']} fb="____" className="dcv" style={{ fontWeight: 600, fontSize: '13px' }} /> mmHg
            </div>
            <div className="dc" style={{ background: '#f5f8f2', border: '1px solid #c0d4b0', borderRadius: '5px', padding: '5px 9px', textAlign: 'center' }}>
              <span className="dck" style={{ fontWeight: 700, color: '#1a3a6b', fontSize: '10.5px', display: 'block' }}>PR</span>
              <EditableSpan value={stripUnits(editData.discharge.pr)} path={['discharge', 'pr']} fb="____" className="dcv" style={{ fontWeight: 600, fontSize: '13px' }} />/min
            </div>
            <div className="dc" style={{ background: '#f5f8f2', border: '1px solid #c0d4b0', borderRadius: '5px', padding: '5px 9px', textAlign: 'center' }}>
              <span className="dck" style={{ fontWeight: 700, color: '#1a3a6b', fontSize: '10.5px', display: 'block' }}>SPO2</span>
              <EditableSpan value={stripUnits(editData.discharge.spo2)} path={['discharge', 'spo2']} fb="____" className="dcv" style={{ fontWeight: 600, fontSize: '13px' }} />% room air
            </div>
          </div>
        </div>

        {/* Discharge Advice */}
        <div className="sec" style={{ marginTop: '12px' }}>
          <div className="sh" style={{ fontWeight: 700, fontSize: '12.5px', color: '#1a3a6b', textTransform: 'uppercase', letterSpacing: '0.4px', padding: '3px 0 3px 8px', borderLeft: '3px solid #4a7c2f', marginBottom: '5px', background: 'linear-gradient(90deg, #f5f8f2, transparent)' }}>Discharge Advice</div>
          <div className="sb" style={{ fontSize: '13px', paddingLeft: '4px' }}>
            <div id="adviceList">
              {(editData.discharge_advice_items.length ? editData.discharge_advice_items : ['______ diet.', 'Avoid oily, spicy and outside foods.']).map((item, idx) => (
                <div key={idx} className="arr" style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginTop: '4px', position: 'relative' }}>
                  <span className="av" style={{ color: '#4a7c2f', fontSize: '11px', marginTop: '2px', flexShrink: 0 }}>➤</span>
                  <EditableSpan value={item} path={['discharge_advice_items', idx]} className="adv-text" style={{ flex: 1 }} />
                  {editMode && (
                    <button onClick={() => removeAdvice(idx)} className="del-adv-btn" style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '13px', fontWeight: 800, width: '20px', height: '20px', borderRadius: '3px', marginLeft: 'auto', flexShrink: 0, alignSelf: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
            {editMode && (
              <button onClick={addAdvice} className="add-adv-btn" style={{ width: '100%', marginTop: '6px', padding: '6px', background: '#f5f8f2', border: '1.5px dashed #4a7c2f', borderRadius: '6px', color: '#2d5a1a', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                <Plus className="h-3 w-3" /> Add Advice Item
              </button>
            )}
          </div>
        </div>

        {/* Review */}
        <div className="sec" style={{ marginTop: '12px' }}>
          <div className="sh" style={{ fontWeight: 700, fontSize: '12.5px', color: '#1a3a6b', textTransform: 'uppercase', letterSpacing: '0.4px', padding: '3px 0 3px 8px', borderLeft: '3px solid #4a7c2f', marginBottom: '5px', background: 'linear-gradient(90deg, #f5f8f2, transparent)' }}>Review</div>
          <div className="rvbox" style={{ background: '#f5f8f2', border: '1px solid #c0d4b0', borderLeft: '3px solid #4a7c2f', borderRadius: '4px', padding: '8px 12px', fontSize: '13px', marginTop: '6px', lineHeight: 1.6 }}>
            <EditableBlock value={editData.review || `To review with ${editData.consultant_name_short || (editData.consultant_name?.replace(/^(Dr\.\s+\w+\s+\w+).*$/, '$1')) || 'Dr. T. Palaniappan'} after ${editData.review_days || '______'} days with CBC, FBS, PPBS, RFT, LFT reports as OP with prior appointment in the front office`} path={['review']} />
          </div>
        </div>

        {/* Typed by & Signatures */}
        <div style={{ marginTop: '14px', fontSize: '12.5px' }}>
          <b style={{ color: '#1a3a6b' }}>Typed by:</b> <EditableSpan value={editData.typed_by} path={['typed_by']} fb="Pavithra.M" />
        </div>
        <div className="sigrow" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px', paddingTop: '10px', borderTop: '1px dashed #c0d4b0' }}>
          <div className="sigb" style={{ textAlign: 'center', flex: 1 }}>
            <div className="sigl" style={{ width: '140px', borderBottom: '1.5px solid #333', margin: '0 auto 4px', height: '26px' }}></div>
            <div className="siglbl" style={{ fontSize: '12px', fontWeight: 700, color: '#333' }}>Duty Medical Officer</div>
          </div>
          <div className="sigb" style={{ textAlign: 'center', flex: 1 }}>
            <div className="sigl" style={{ width: '140px', borderBottom: '1.5px solid #333', margin: '0 auto 4px', height: '26px' }}></div>
            <div className="siglbl" style={{ fontSize: '12px', fontWeight: 700, color: '#333' }}>Consultant Signature</div>
            <div className="sigsub" style={{ fontSize: '11px', color: '#777' }}>
              ({editData.consultant_name_short || (editData.consultant_name?.replace(/^(Dr\.\s+\w+\s+\w+).*$/, '$1')) || 'Dr. T. Palaniappan'})
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="docft" style={{ textAlign: 'center', marginTop: '16px', paddingTop: '9px', borderTop: '1px solid #c0d4b0', fontSize: '12px', color: '#888' }}>
          To visit us at <a href="https://www.medwayhospitals.com" style={{ color: '#1a3a6b', textDecoration: 'none', fontWeight: 600 }}>www.medwayhospitals.com</a> &nbsp;|&nbsp; Emergency: 2473 4455
        </div>
      </div>
    </div>
  );

  return (
    <>
      {!readOnly && (
        <div className="flex justify-end gap-2 mb-4">
          <button
            onClick={() => setIsFullscreen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            <Maximize2 className="h-4 w-4" />
            Fullscreen
          </button>
          {editMode ? (
            <>
              <button
                onClick={handleSave}
                className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-green-700"
              >
                <Save className="h-4 w-4" />
                Save
              </button>
              <button
                onClick={() => { setEditData(data); setEditMode(false); }}
                className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditMode(true)}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <Edit3 className="h-4 w-4" />
              Edit Summary
            </button>
          )}
        </div>
      )}
      
      <div className="overflow-auto max-h-[75vh] custom-scrollbar">
        <SummaryContent />
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setIsFullscreen(false)}>
          <div className="relative bg-white rounded-xl max-w-5xl max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setIsFullscreen(false)}
              className="sticky top-4 right-4 float-right p-2 bg-gray-100 rounded-full hover:bg-gray-200 z-10"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="clear-both" />
            <SummaryContent />
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #a1a1a1;
        }
      `}</style>
    </>
  );
}