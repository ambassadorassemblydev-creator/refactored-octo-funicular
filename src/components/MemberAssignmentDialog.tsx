import * as React from "react";
import { 
  Shield, 
  Building2, 
  ShieldCheck, 
  Award, 
  Users,
  Loader2,
  CheckCircle2,
  AlertCircle,
  HeartHandshake
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/src/lib/supabase";
import { toast } from "sonner";
import { auditRepo } from "@/src/lib/audit";

interface Props {
  member: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function MemberAssignmentDialog({ member, open, onOpenChange, onSuccess }: Props) {
  const [loading, setLoading] = React.useState(false);
  const [roles, setRoles] = React.useState<any[]>([]);
  const [departments, setDepartments] = React.useState<any[]>([]);
  const [ministries, setMinistries] = React.useState<any[]>([]);
  const [positions, setPositions] = React.useState<any[]>([]);
  
  // Selection states
  const [selectedRole, setSelectedRole] = React.useState<string>("");
  const [selectedTitle, setSelectedTitle] = React.useState<string>(member?.title || "");
  const [selectedDept, setSelectedDept] = React.useState<string>("");
  const [selectedMinistry, setSelectedMinistry] = React.useState<string>("");
  const [selectedPosition, setSelectedPosition] = React.useState<string>("");

  const fetchData = async () => {
    try {
      const [
        { data: rData },
        { data: dData },
        { data: mData },
        { data: pData },
        { data: urData },
        { data: cwData }
      ] = await Promise.all([
        supabase.from('roles').select('id, name'),
        supabase.from('church_departments').select('id, name'),
        supabase.from('ministries').select('id, name'),
        supabase.from('church_positions').select('id, title'),
        supabase.from('user_roles').select('role_id').eq('user_id', member.id).maybeSingle(),
        supabase.from('church_workers').select('department_id, position_id').eq('user_id', member.id).maybeSingle()
      ]);

      setRoles(rData || []);
      setDepartments(dData || []);
      setMinistries(mData || []);
      setPositions(pData || []);

      if (urData) {
        const role = rData?.find(r => r.id === urData.role_id);
        if (role) setSelectedRole(role.name);
      }
      if (cwData) {
        setSelectedDept(cwData.department_id || "");
        setSelectedPosition(cwData.position_id || "");
      }
      if (member?.ministry) {
        setSelectedMinistry(member.ministry);
      }
    } catch (err) {
      console.error(err);
    }
  };

  React.useEffect(() => {
    if (open && member) {
      fetchData();
    }
  }, [open, member]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const updates = [];

      // 1. Update Role
      if (selectedRole) {
        const roleId = roles.find(r => r.name === selectedRole)?.id;
        if (roleId) {
          updates.push(supabase.from('user_roles').upsert({ 
            user_id: member.id, 
            role_id: roleId,
            is_active: true
          }, { onConflict: 'user_id' }));
        }
      }

      // 2. Update Department (Church Workers)
      if (selectedDept && selectedDept !== 'none') {
        updates.push((supabase.from('church_workers') as any).upsert({
          user_id: member.id,
          department_id: selectedDept,
          position_id: selectedPosition || null,
          status: 'active'
        }, { onConflict: 'user_id' }));
      }

      // 3. Update Profile (Title + Ministry + Department field cache)
      updates.push(supabase.from('profiles').update({ 
        title: selectedTitle as any,
        ministry: (selectedMinistry !== 'none' ? selectedMinistry : null) as any,
        department: (departments.find(d => d.id === selectedDept)?.name || null) as any
      } as any).eq('id', member.id));

      const saveResults = await Promise.all(updates);
      const errors = saveResults.filter(r => r.error);
      
      if (errors.length > 0) {
        throw new Error(errors[0].error?.message || "Some updates failed");
      }

      // Audit Log
      await auditRepo.logAction({
        admin_id: (await supabase.auth.getUser()).data.user?.id || 'unknown',
        action: 'UPDATE',
        table_name: 'profiles/roles/workers',
        record_id: member.id,
        new_values: { role: selectedRole, title: selectedTitle, dept: selectedDept, ministry: selectedMinistry }
      });

      toast.success("Member assignments updated successfully! 🎖️");
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-[500px] rounded-3xl border-none shadow-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black flex items-center gap-2 text-primary">
            <ShieldCheck className="w-6 h-6" />
            Manage Assignments
          </DialogTitle>
          <DialogDescription className="font-medium">
            Update roles, titles, and department assignments for {member?.first_name}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* SYSTEM ROLE */}
          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Shield className="w-3 h-3" /> System Role (Access Level)
            </Label>
            <Select value={selectedRole} onValueChange={v => v && setSelectedRole(v)}>
              <SelectTrigger className="h-12 rounded-2xl bg-muted/30 border-none">
                <SelectValue placeholder="Select access level" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-none shadow-xl">
                {roles.map(r => (
                  <SelectItem key={r.id} value={r.name} className="rounded-xl uppercase text-[10px] font-bold tracking-widest">
                    {r.name.replace('_', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* CHURCH TITLE */}
          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Award className="w-3 h-3" /> Ecclesiastical Title
            </Label>
            <Select value={selectedTitle} onValueChange={v => v && setSelectedTitle(v)}>
              <SelectTrigger className="h-12 rounded-2xl bg-muted/30 border-none">
                <SelectValue placeholder="Select title" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-none shadow-xl">
                <SelectItem value="Mr" className="rounded-xl">Mr</SelectItem>
                <SelectItem value="Mrs" className="rounded-xl">Mrs</SelectItem>
                <SelectItem value="Ms" className="rounded-xl">Ms</SelectItem>
                <SelectItem value="Dr" className="rounded-xl">Dr</SelectItem>
                <SelectItem value="Pastor" className="rounded-xl">Pastor</SelectItem>
                <SelectItem value="Deacon" className="rounded-xl">Deacon</SelectItem>
                <SelectItem value="Deaconess" className="rounded-xl">Deaconess</SelectItem>
                <SelectItem value="Elder" className="rounded-xl">Elder</SelectItem>
                <SelectItem value="Minister" className="rounded-xl">Minister</SelectItem>
                <SelectItem value="Bishop" className="rounded-xl">Bishop</SelectItem>
                <SelectItem value="Evangelist" className="rounded-xl">Evangelist</SelectItem>
                <SelectItem value="Apostle" className="rounded-xl">Apostle</SelectItem>
                <SelectItem value="Prophet" className="rounded-xl">Prophet</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* DEPARTMENT */}
          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Building2 className="w-3 h-3" /> Functional Department
            </Label>
            <Select value={selectedDept} onValueChange={v => v && setSelectedDept(v)}>
              <SelectTrigger className="h-12 rounded-2xl bg-muted/30 border-none">
                <SelectValue placeholder="Assign to department" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-none shadow-xl">
                <SelectItem value="none" className="rounded-xl italic">No Assignment</SelectItem>
                {departments.map(d => (
                  <SelectItem key={d.id} value={d.id} className="rounded-xl">
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* POSITION */}
          {selectedDept && selectedDept !== 'none' && (
            <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Users className="w-3 h-3" /> Role within Department
              </Label>
              <Select value={selectedPosition} onValueChange={v => v && setSelectedPosition(v)}>
                <SelectTrigger className="h-12 rounded-2xl bg-muted/30 border-none">
                  <SelectValue placeholder="Select specific role" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-xl">
                  {positions.map(p => (
                    <SelectItem key={p.id} value={p.id} className="rounded-xl">
                      {p.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* MINISTRY */}
          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <HeartHandshake className="w-3 h-3" /> Spiritual Ministry
            </Label>
            <Select value={selectedMinistry} onValueChange={v => v && setSelectedMinistry(v)}>
              <SelectTrigger className="h-12 rounded-2xl bg-muted/30 border-none">
                <SelectValue placeholder="Assign to ministry" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-none shadow-xl">
                <SelectItem value="none" className="rounded-xl italic">No Assignment</SelectItem>
                {ministries.map(m => (
                  <SelectItem key={m.id} value={m.name} className="rounded-xl">
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1 rounded-2xl h-12 font-bold uppercase tracking-widest text-[10px]">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading} className="flex-1 rounded-2xl h-12 font-bold uppercase tracking-widest text-[10px] gap-2 shadow-xl shadow-primary/20">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            Save Assignments
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
