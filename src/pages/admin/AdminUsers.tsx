import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

type UserRow = {
  id: string;
  user_id: string;
  full_name: string | null;
  roles: string[];
};

const ROLES = ["admin", "instructor", "student"] as const;

const AdminUsers = () => {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data: profiles } = await supabase.from("profiles").select("id,user_id,full_name");
    const { data: roles } = await supabase.from("user_roles").select("user_id,role");
    const rolesByUser: Record<string, string[]> = {};
    (roles ?? []).forEach((r) => {
      (rolesByUser[r.user_id] ||= []).push(r.role);
    });
    setUsers(
      (profiles ?? []).map((p) => ({
        id: p.id,
        user_id: p.user_id,
        full_name: p.full_name,
        roles: rolesByUser[p.user_id] ?? [],
      }))
    );
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const toggleRole = async (userId: string, role: string, has: boolean) => {
    if (has) {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role);
      if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: role as "admin" | "instructor" | "student" });
      if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    }
    load();
  };

  return (
    <div className="p-10 max-w-5xl">
      <div className="mb-8">
        <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-2">Admin</p>
        <h1 className="text-3xl">Users & Roles</h1>
        <p className="text-muted-foreground text-sm mt-2">
          Assign admin or instructor roles. Only admins can change roles.
        </p>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Loading...</p>
      ) : (
        <div className="border border-border/50">
          <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-border/50 text-[10px] tracking-editorial uppercase text-muted-foreground">
            <div className="col-span-5">Name</div>
            <div className="col-span-7">Roles</div>
          </div>
          {users.map((u) => (
            <div key={u.id} className="grid grid-cols-12 gap-4 px-5 py-4 border-b border-border/50 last:border-0 items-center text-sm">
              <div className="col-span-5">
                <p>{u.full_name || "—"}</p>
                <p className="text-[11px] text-muted-foreground">{u.user_id.slice(0, 8)}</p>
              </div>
              <div className="col-span-7 flex gap-2 flex-wrap">
                {ROLES.map((r) => {
                  const has = u.roles.includes(r);
                  return (
                    <Button
                      key={r}
                      size="sm"
                      variant={has ? "default" : "outline"}
                      onClick={() => toggleRole(u.user_id, r, has)}
                      className="rounded-none text-[10px] tracking-editorial uppercase h-7"
                    >
                      {r}
                    </Button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
