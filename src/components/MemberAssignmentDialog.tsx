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
  HeartHandshake,
  RotateCw
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
  const [dataLoading, setDataLoading] = React.useState(true);
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
    setDataLoading(true);
    try {
      const [
        { data: rData },
        { data: dData },
        { data: mData },
        { data: pData },
        { data: profileData },
        { data: cwData },
        { data: mmData }
      ] = await Promise.all([
        supabase.from('roles').select('id, name'),
        supabase.from('church_departments').select('id, name'),
        supabase.from('ministries').select('id, name'),
        supabase.from('church_positions').select('id, title, department_id'),
        supabase.from('profiles').select('role_claim').eq('id', member.id).single(),
        supabase.from('church_workers').select('department_id, position_id').eq('user_id', member.id).maybeSingle(),
        supabase.from('ministry_members').select('ministry_id').eq('user_id', member.id).maybeSingle()
      ]);

      setRoles(rData || []);
      setDepartments(dData || []);
      setMinistries(mData || []);
      setPositions(pData || []);

      // Read role directly from profile
      if (profileData?.role_claim) {
        setSelectedRole(profileData.role_claim);
      }
      if (cwData) {
        setSelectedDept(cwData.department_id || "");
        setSelectedPosition(cwData.position_id || "");
      }
      if (mmData) {
        setSelectedMinistry(mmData.ministry_id || "");
      } else if (member?.ministry) {
        const fallbackMinistry = (mData || []).find(m => m.name === member.ministry);
        if (fallbackMinistry) setSelectedMinistry(fallbackMinistry.id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDataLoading(false);
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
      // 1. Handle Role Update — single source of truth on profiles
      if (selectedRole) {
        const { error: roleErr } = await supabase.from('profiles')
          .update({ role_claim: selectedRole })
          .eq('id', member.id);
        if (roleErr) throw roleErr;
      }

      // 2. Handle Department/Position Update
      if (selectedDept && selectedDept !== 'none') {
        const { data: existingWorker } = await supabase.from('church_workers').select('id').eq('user_id', member.id).maybeSingle();
        if (existingWorker) {
          const { error: workerErr } = await (supabase.from('church_workers') as any).update({
            department_id: selectedDept,
            position_id: selectedPosition || undefined,
            status: 'active'
          }).eq('id', existingWorker.id);
          if (workerErr) throw workerErr;
        } else {
          const { error: workerErr } = await (supabase.from('church_workers') as any).insert({
            user_id: member.id,
            department_id: selectedDept,
            position_id: selectedPosition || undefined,
            status: 'active'
          });
          if (workerErr) throw workerErr;
        }
      } else if (selectedDept === 'none') {
        await supabase.from('church_workers').delete().eq('user_id', member.id);
      }

      // 3. Handle Ministry Update
      if (selectedMinistry && selectedMinistry !== 'none') {
        const { data: existingMinMember } = await supabase.from('ministry_members').select('id').eq('user_id', member.id).maybeSingle();
        if (existingMinMember) {
          const { error: minErr } = await supabase.from('ministry_members').update({
            ministry_id: selectedMinistry,
            role: 'member'
          }).eq('id', existingMinMember.id);
          if (minErr) throw minErr;
        } else {
          const { error: minErr } = await supabase.from('ministry_members').insert({
            user_id: member.id,
            ministry_id: selectedMinistry,
            role: 'member'
          });
          if (minErr) throw minErr;
        }
      } else if (selectedMinistry === 'none') {
        await supabase.from('ministry_members').delete().eq('user_id', member.id);
      }

      // 4. Update Profile (Title + Ministry + Department field cache)
      const deptName = departments.find(d => d.id === selectedDept)?.name || null;
      const minName = ministries.find(m => m.id === selectedMinistry)?.name || null;
      const { error: profileErr } = await supabase.from('profiles').update({ 
        title: selectedTitle as any,
        ministry: minName as any,
        department: deptName as any
      } as any).eq('id', member.id);
      
      if (profileErr) throw profileErr;

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
      console.error("Assignment Save Error:", err);
      toast.error(err.message || "Failed to update assignments");
    } finally {
      setLoading(false);
    }
  };

  const renderSelectValue = (value: string, items: any[], placeholder: string, labelKey: string = 'name') => {
    if (dataLoading) return <div className="flex items-center gap-2"><Loader2 className="w-3 h-3 animate-spin" /> Loading...</div>;
    if (!value || value === 'none') return placeholder;
    const item = items.find(i => (i.id === value || i.name === value));
    if (item) return item[labelKey] || item.name || item.title;
    
    // Safety check for ID bleed-through: if value is UUID-like but not found, truncate it
    if (value.length > 20 && value.includes('-')) {
        return <span className="text-muted-foreground italic">Unknown ({value.substring(0, 8)}...)</span>;
    }
    return value;
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
            <Select value={selectedRole} onValueChange={v => v && setSelectedRole(v)} disabled={dataLoading}>
              <SelectTrigger className="h-12 rounded-2xl bg-muted/30 border-none">
                <SelectValue placeholder="Select access level">
                    {renderSelectValue(selectedRole, roles, "Select access level")}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-none shadow-xl">
                {roles.map(r => (
                  <SelectItem key={r.id} value={r.name} className="rounded-xl uppercase text-[10px] font-bold tracking-widest">
                    {r.name?.replace('_', ' ')}
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
            <Select value={selectedTitle} onValueChange={v => v && setSelectedTitle(v)} disabled={dataLoading}>
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
            <Select value={selectedDept} onValueChange={v => v && setSelectedDept(v)} disabled={dataLoading}>
              <SelectTrigger className="h-12 rounded-2xl bg-muted/30 border-none">
                <SelectValue placeholder="Assign to department">
                    {renderSelectValue(selectedDept, departments, "Assign to department")}
                </SelectValue>
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
              <Select value={selectedPosition} onValueChange={v => v && setSelectedPosition(v)} disabled={dataLoading}>
                <SelectTrigger className="h-12 rounded-2xl bg-muted/30 border-none">
                  <SelectValue placeholder="Select specific role">
                    {renderSelectValue(selectedPosition, positions, "Select specific role", 'title')}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-xl">
                  {positions.filter(p => p.department_id === selectedDept).map(p => (
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
            <Select value={selectedMinistry} onValueChange={v => v && setSelectedMinistry(v)} disabled={dataLoading}>
              <SelectTrigger className="h-12 rounded-2xl bg-muted/30 border-none">
                <SelectValue placeholder="Assign to ministry">
                    {renderSelectValue(selectedMinistry, ministries, "Assign to ministry")}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-none shadow-xl">
                <SelectItem value="none" className="rounded-xl italic">No Assignment</SelectItem>
                {ministries.map(m => (
                  <SelectItem key={m.id} value={m.id} className="rounded-xl">
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
          <Button onClick={handleSave} disabled={loading || dataLoading} className="flex-1 rounded-2xl h-12 font-bold uppercase tracking-widest text-[10px] gap-2 shadow-xl shadow-primary/20">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            Save Assignments
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
