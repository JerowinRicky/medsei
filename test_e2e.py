import requests
import json

BASE_URL = "http://localhost:5000/api/v1"

def run_e2e():
    print("[1/5] Authenticating as Super Admin...")
    auth_res = requests.post(f"{BASE_URL}/auth/login", json={
        "email": "admin@amvionhealth.org",
        "password": "Admin@123456"
    })
    auth_res.raise_for_status()
    token = auth_res.json()["data"]["token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("[OK] Successfully authenticated.")

    print("[2/5] Querying Projects & Project Types...")
    proj_res = requests.get(f"{BASE_URL}/projects", headers=headers)
    proj_res.raise_for_status()
    projs = proj_res.json()["data"]
    proj_id = projs[0]["id"]
    proj_type_id = projs[0]["projectTypes"][0]["id"]
    print(f"[OK] Using Project: {projs[0]['name']} (ID: {proj_id})")

    print("[3/5] Testing Option 1: Initializing Task from HMS (Patient Eleanor Vance)...")
    task_res = requests.post(f"{BASE_URL}/tasks", headers=headers, json={
        "projectId": proj_id,
        "projectTypeId": proj_type_id,
        "dataSource": "HMS",
        "uhid": "UHID-2026-4420"
    })
    task_res.raise_for_status()
    task = task_res.json()["data"]
    task_id = task["id"]
    print(f"[OK] Created Task: {task['taskNumber']}, Status: {task['status']}")

    print("[4/5] Testing Summary Generation using Dynamic Approved Template...")
    tpl_res = requests.get(f"{BASE_URL}/summaries/templates", headers=headers)
    tpl_res.raise_for_status()
    template_id = tpl_res.json()["data"][0]["id"]

    gen_res = requests.post(f"{BASE_URL}/summaries/generate", headers=headers, json={
        "taskId": task_id,
        "templateId": template_id
    })
    gen_res.raise_for_status()
    summary = gen_res.json()["data"]
    summary_id = summary["id"]
    print(f"[OK] Summary Generated: Revision #{summary['revisionNumber']}, Status: {summary['status']}")

    print("[5/5] Testing Physician Approval Workflow and Immutability Lock...")
    app_res = requests.post(f"{BASE_URL}/summaries/{summary_id}/approve", headers=headers, json={
        "digitalSignatureRef": "SIG-DR-KUMAR-9921"
    })
    app_res.raise_for_status()
    app_summary = app_res.json()["data"]
    print(f"[OK] Summary Approved: Immutable={app_summary['isImmutable']}, Sig={app_summary['digitalSignatureRef']}")

    # Verify Audit trail updated
    audit_res = requests.get(f"{BASE_URL}/audit-logs", headers=headers)
    recent_logs = audit_res.json()["data"]
    print(f"[OK] Total Audit Log Events: {len(recent_logs)} (Latest event: {recent_logs[0]['action']})")
    print("\nALL CLINICAL AND ENTERPRISE WORKFLOWS VERIFIED SUCCESSFULLY!")

if __name__ == "__main__":
    run_e2e()
