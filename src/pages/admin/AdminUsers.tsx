import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

type UserRow = {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string;
  roles: string[];
};

const ROLES = ["admin", "instructor", "student"] as const;

const AdminUsers = () => {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.get<UserRow[]>("/users");
      setUsers(data);
    } catch (e) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "Gagal memuat", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggleRole = async (userId: string, role: typeof ROLES[number], has: boolean) => {
    try {
      if (has) {
        await api.delete(`/users/${userId}/roles/${role}`);
      } else {
        await api.post(`/users/${userId}/roles`, { role });
      }
      load();
    } catch (e) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "Gagal mengubah role", variant: "destructive" });
    }
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
                <Link to={`/admin/users/${u.user_id}`} className="hover:underline">
                  <p>{u.full_name || u.email || "—"}</p>
                  <p className="text-[11px] text-muted-foreground">{u.email}</p>
                </Link>
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
