import React from "react";
import { Link } from "react-router-dom";
import { Card } from "../../components/ui/Card.jsx";

export function AuditPage() {
  return (
    <div className="min-h-screen bg-[#05070b] bg-grid">
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-white font-extrabold text-2xl">Audit Log</div>
            <div className="text-white/60 text-sm mt-1">
              kim nima qildi: action, ip, ua, before/after
            </div>
          </div>
          <Link
            to="/admin"
            className="text-emerald-300 hover:text-emerald-200 text-sm font-semibold"
          >
            ← Back to Dashboard
          </Link>
        </div>

        <div className="mt-6">
          <Card className="p-5">
            <div className="text-white font-bold">Coming next</div>
            <div className="text-white/65 text-sm mt-1">
              Backendda `admin_audit_logs` table va `/api/admin/audit_list.php`
              endpoint qo‘shamiz.
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
