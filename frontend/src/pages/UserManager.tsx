import React, { useEffect, useState } from "react";
import { api } from "../services/api";
import { Badge, Button } from "../components/UI";
import { Users, Shield, Plus, Check } from "lucide-react";

export const UserManager: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New user modal state
  const [showModal, setShowModal] = useState(false);
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [title, setTitle] = useState("");
  const [roleId, setRoleId] = useState("");

  const fetchData = async () => {
    try {
      const [uRes, rRes] = await Promise.all([
        api.get("/users"),
        api.get("/roles")
      ]);
      setUsers(uRes.data.data);
      setRoles(rRes.data.data);
      if (rRes.data.data.length > 0) setRoleId(rRes.data.data[0].id);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/users", {
        email,
        firstName,
        lastName,
        title,
        roleId,
        password: "User@123456"
      });
      setShowModal(false);
      setEmail("");
      setFirstName("");
      setLastName("");
      setTitle("");
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || "Failed to create user.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-3">
        <div>
          <h1 className="text-base font-bold text-black tracking-tight">User & Role-Based Access Control (RBAC)</h1>
          <p className="text-xs text-[#666666]">
            Manage hospital staff, attending consultants, reviewers, and permission matrices
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowModal(true)}>
          <Plus className="w-3.5 h-3.5" />
          <span>Add Staff Member</span>
        </Button>
      </div>

      {/* Users Table */}
      <div className="border border-[#E5E5E5] rounded bg-white overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#F7F7F7] border-b border-[#E5E5E5] text-[#666666]">
            <tr>
              <th className="py-2.5 px-3 font-medium">Staff Name & Title</th>
              <th className="py-2.5 px-3 font-medium">Email</th>
              <th className="py-2.5 px-3 font-medium">Role</th>
              <th className="py-2.5 px-3 font-medium">Account Status</th>
              <th className="py-2.5 px-3 font-medium">Last Login</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E5E5]">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-[#FAFAFA]">
                <td className="py-2.5 px-3 font-medium text-black">
                  <div>{u.firstName} {u.lastName}</div>
                  <div className="text-[11px] text-[#666666]">{u.title || "Clinical Staff"}</div>
                </td>
                <td className="py-2.5 px-3 font-mono text-[11px] text-[#444444]">{u.email}</td>
                <td className="py-2.5 px-3">
                  <span className="font-mono text-[11px] bg-[#F7F7F7] px-2 py-0.5 rounded border border-[#E5E5E5]">
                    {u.role?.name}
                  </span>
                </td>
                <td className="py-2.5 px-3">
                  <Badge status={u.status}>{u.status}</Badge>
                </td>
                <td className="py-2.5 px-3 text-[#666666] font-mono text-[11px]">
                  {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : "Never"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Roles & Permissions Breakdown */}
      <div className="border border-[#E5E5E5] rounded p-4 bg-white space-y-3">
        <h2 className="text-xs font-bold text-black uppercase tracking-wider">
          Configured System Roles & Permissions Matrix
        </h2>
        <div className="grid grid-cols-3 gap-3">
          {roles.map((r) => (
            <div key={r.id} className="border border-[#E5E5E5] p-3 rounded bg-[#FAFAFA] space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-black">{r.name}</span>
                <span className="text-[10px] font-mono text-[#666666]">{r.rolePermissions?.length || 0} Perms</span>
              </div>
              <p className="text-[11px] text-[#666666] leading-relaxed">{r.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Simple Creation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-[#E5E5E5] rounded max-w-md w-full p-6 space-y-4 shadow-lg">
            <h3 className="text-sm font-bold text-black border-b border-[#E5E5E5] pb-2">Add Hospital Staff Member</h3>
            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[#444444] mb-1">First Name</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    className="w-full h-8 px-2 border border-[#E5E5E5] rounded focus:outline-none focus:border-black"
                  />
                </div>
                <div>
                  <label className="block text-[#444444] mb-1">Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    className="w-full h-8 px-2 border border-[#E5E5E5] rounded focus:outline-none focus:border-black"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#444444] mb-1">Clinical Title / Department</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Attending Physician, Internal Medicine"
                  className="w-full h-8 px-2 border border-[#E5E5E5] rounded focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="block text-[#444444] mb-1">Institutional Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full h-8 px-2 border border-[#E5E5E5] rounded focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="block text-[#444444] mb-1">Assigned Role</label>
                <select
                  value={roleId}
                  onChange={(e) => setRoleId(e.target.value)}
                  className="w-full h-8 px-2 border border-[#E5E5E5] rounded focus:outline-none focus:border-black"
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E5E5E5]">
                <Button variant="outline" size="sm" onClick={() => setShowModal(false)} type="button">
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit">
                  Save Member
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

