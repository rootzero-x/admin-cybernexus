import React from "react";
import { Card } from "../../../components/ui/Card.jsx";
import { ShieldCheck, Users, Activity, Lock } from "lucide-react";

const items = [
  { title: "Auth", value: "Step1 + 2FA", icon: ShieldCheck },
  { title: "Session", value: "Cookie Secure", icon: Lock },
  { title: "Users", value: "DB: users", icon: Users },
  { title: "Monitoring", value: "Audit soon", icon: Activity },
];

export function StatCards() {
  return (
    <div className="grid md:grid-cols-4 gap-4">
      {items.map((it) => {
        const Icon = it.icon;
        return (
          <Card key={it.title} className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-white/60 text-xs font-semibold">
                {it.title}
              </div>
              <Icon size={18} className="text-emerald-300" />
            </div>
            <div className="mt-2 text-white font-extrabold text-lg">
              {it.value}
            </div>
            <div className="mt-1 text-white/40 text-xs">Premium Admin Core</div>
          </Card>
        );
      })}
    </div>
  );
}
