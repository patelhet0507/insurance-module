import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { PageHeader } from "@/components/shared/PageHeader";
import { PremiumSchedule } from "@/components/shared/PremiumSchedule";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePolicies, useCustomers, useCompanies, useBrokers, useInsuranceTypes, useInsuredSubjectTypes, usePolicy } from "@/hooks/useData";
import { useCreate, useUpdate } from "@/hooks/useFirestore";
import { useAuth } from "@/context/AuthContext";
import { canWrite } from "@/context/AuthContext";
import { CURRENCIES, POLICY_TERMS, POLICY_TERM_MONTHS, PAYMENT_MODES } from "@/lib/constants";
import { notifyError, notifySuccess } from "@/components/ui/toast";
import { nowIso, customerDisplayName, normalizeSubjectFields } from "@/lib/utils";
import dayjs from "dayjs";
import type { Policy, PolicyStatus } from "@/types";

export function PolicyFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { doc: policy, loading: polLoading } = usePolicy(id);
  const { docs: customers } = useCustomers();
  const { docs: companies } = useCompanies();
  const { docs: brokers } = useBrokers();
  const { docs: insuranceTypes } = useInsuranceTypes();
  const { docs: subjectTypes } = useInsuredSubjectTypes();
  const { create } = useCreate("policies");
  const { update } = useUpdate();

  const writable = canWrite(profile?.role);

  const [form, setForm] = useState({
    policyNumber: "",
    customerId: "",
    insuredSubject: "",
    insuredSubjectId: "",
    subjectDetails: {} as Record<string, string>,
    companyId: "",
    insuranceTypeId: "",
    brokerId: "",
    premium: "",
    currency: "INR",
    term: "yearly" as string,
    paymentMode: "Yearly" as string,
    startDate: "",
    endDate: "",
    status: "pending" as PolicyStatus,
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (policy) {
      setForm({
        policyNumber: policy.policyNumber || "",
        customerId: policy.customerId || "",
        insuredSubject: policy.insuredSubject || "",
        insuredSubjectId: policy.insuredSubjectId || "",
        subjectDetails: policy.subjectDetails || {},
        companyId: policy.companyId || "",
        insuranceTypeId: policy.insuranceTypeId || "",
        brokerId: policy.brokerId || "",
        premium: policy.premium != null ? String(policy.premium) : "",
        currency: policy.currency || "INR",
        term: policy.term || "yearly",
        paymentMode: policy.paymentMode || "Yearly",
        startDate: policy.startDate || "",
        endDate: policy.endDate || "",
        status: policy.status || "pending",
        notes: policy.notes || "",
      });
    }
  }, [policy]);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  // term change: recompute endDate from startDate + term months
  const setTerm = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const term = e.target.value;
    setForm((f) => {
      const months = POLICY_TERM_MONTHS[term as keyof typeof POLICY_TERM_MONTHS];
      const endDate = f.startDate && months ? dayjs(f.startDate).add(months, "month").format("YYYY-MM-DD") : f.endDate;
      return { ...f, term, endDate };
    });
  };

  // startDate change: keep manual endDate unless it was auto-filled, then recompute only if term set
  const setStartDate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const startDate = e.target.value;
    setForm((f) => {
      const months = POLICY_TERM_MONTHS[f.term as keyof typeof POLICY_TERM_MONTHS];
      const endDate = startDate && months ? dayjs(startDate).add(months, "month").format("YYYY-MM-DD") : f.endDate;
      return { ...f, startDate, endDate };
    });
  };

  // subject type change: reset detail fields for the new type
  const setSubject = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const subjectType = subjectTypes.find((t) => t.id === e.target.value);
    const details: Record<string, string> = {};
    for (const f of normalizeSubjectFields(subjectType?.fields)) details[f.name] = "";
    setForm((f) => ({ ...f, insuredSubjectId: e.target.value, insuredSubject: subjectType?.name ?? "", subjectDetails: details }));
  };

  const setDetail = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, subjectDetails: { ...f.subjectDetails, [key]: e.target.value } }));

  const subjectFields = normalizeSubjectFields(subjectTypes.find((t) => t.id === form.insuredSubjectId)?.fields);

  const canSubmit = useMemo(
    () =>
      form.policyNumber.trim() &&
      form.customerId &&
      form.insuredSubjectId &&
      subjectFields.every((f) => !f.required || (form.subjectDetails[f.name] ?? "").trim()) &&
      form.companyId &&
      form.insuranceTypeId &&
      form.premium &&
      form.startDate &&
      form.endDate,
    [form, subjectFields]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSaving(true);
    try {
      const num = form.policyNumber.trim();
      const dup = await getDocs(query(collection(db, "policies"), where("policyNumber", "==", num)));
      if (dup.docs.some((d) => d.id !== id)) {
        notifyError("A policy with this number already exists");
        return;
      }
      const payload = {
        policyNumber: num,
        customerId: form.customerId,
        insuredSubject: form.insuredSubject.trim() || null,
        insuredSubjectId: form.insuredSubjectId || null,
        subjectDetails: form.subjectDetails,
        companyId: form.companyId,
        insuranceTypeId: form.insuranceTypeId,
        brokerId: form.brokerId || null,
        premium: parseFloat(form.premium),
        currency: form.currency,
        term: form.term,
        paymentMode: form.paymentMode,
        startDate: form.startDate,
        endDate: form.endDate,
        status: form.status,
        notes: form.notes.trim() || null,
      };
      if (isEdit && id) {
        await update(`policies/${id}`, payload);
        notifySuccess("Policy updated");
        navigate(`/policies/${id}`);
      } else {
        const { id: newId } = await create({ ...payload, createdAt: nowIso() });
        notifySuccess("Policy created");
        navigate(`/policies/${newId}`);
      }
    } catch (err) {
      notifyError(err instanceof Error ? err.message : "Failed to save policy");
    } finally {
      setSaving(false);
    }
  }  if (isEdit && polLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  if (isEdit && !policy) {
    return <div className="text-muted-foreground">Policy not found.</div>;
  }

  if (!writable) {
    return <div className="text-muted-foreground">You don't have permission to edit policies.</div>;
  }

  const input = "bg-background";

  return (
    <div className="space-y-6">
      <PageHeader title={isEdit ? "Edit Policy" : "New Policy"}>
        <Button variant="outline" onClick={() => navigate(isEdit ? `/policies/${id}` : "/policies")}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
      </PageHeader>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Policy Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="policyNumber">Policy Number *</Label>
              <Input id="policyNumber" required value={form.policyNumber} onChange={set("policyNumber")} placeholder="e.g. POL-2026-001" className={input} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select id="status" value={form.status} onChange={set("status")} className={input}>
                <option value="pending">Pending</option>
                <option value="active">Active</option>
                <option value="expired">Expired</option>
                <option value="cancelled">Cancelled</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerId">Customer *</Label>
              <Select id="customerId" required value={form.customerId} onChange={set("customerId")} className={input}>
                <option value="">Select customer…</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {customerDisplayName(c)}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="insuredSubjectId">Insured Subject *</Label>
              <Select id="insuredSubjectId" required value={form.insuredSubjectId} onChange={setSubject} className={input}>
                <option value="">Select subject…</option>
                {subjectTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </Select>
            </div>
                {(subjectFields.length > 0) && (
                  <div className="grid gap-4 sm:grid-cols-2 sm:col-span-2 rounded-lg border p-4">
                    <p className="text-sm font-medium text-muted-foreground sm:col-span-2">
                      {form.insuredSubject} details
                    </p>
                    {subjectFields.map((f) => (
                      <div key={f.name} className="space-y-2">
                        <Label htmlFor={`subject-${f.name}`}>
                          {f.name}
                          {f.required && " *"}
                        </Label>
                        <Input id={`subject-${f.name}`} required={f.required} value={form.subjectDetails[f.name] ?? ""} onChange={setDetail(f.name)} className={input} />
                      </div>
                    ))}
                  </div>
                )}
            <div className="space-y-2">
              <Label htmlFor="companyId">Insurance Company *</Label>
              <Select id="companyId" required value={form.companyId} onChange={set("companyId")} className={input}>
                <option value="">Select company…</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="insuranceTypeId">Insurance Type *</Label>
              <Select id="insuranceTypeId" required value={form.insuranceTypeId} onChange={set("insuranceTypeId")} className={input}>
                <option value="">Select type…</option>
                {insuranceTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="brokerId">Broker</Label>
              <Select id="brokerId" value={form.brokerId} onChange={set("brokerId")} className={input}>
                <option value="">No broker</option>
                {brokers.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="premium">Premium *</Label>
              <Input id="premium" required type="number" min="0" step="0.01" value={form.premium} onChange={set("premium")} placeholder="0.00" className={input} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select id="currency" value={form.currency} onChange={set("currency")} className={input}>
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date *</Label>
              <Input id="startDate" required type="date" value={form.startDate} onChange={setStartDate} className={input} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="term">Term *</Label>
              <Select id="term" required value={form.term} onChange={setTerm} className={input}>
                {POLICY_TERMS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentMode">Payment Mode *</Label>
              <Select id="paymentMode" required value={form.paymentMode} onChange={set("paymentMode")} className={input}>
                {PAYMENT_MODES.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date *</Label>
              <Input id="endDate" required type="date" value={form.endDate} onChange={set("endDate")} className={input} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" value={form.notes} onChange={set("notes")} placeholder="Optional notes…" className={input} />
            </div>
          </CardContent>
          <CardContent className="space-y-4">
            <PremiumSchedule
              term={form.term}
              startDate={form.startDate}
              premium={form.premium}
              currency={form.currency}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => navigate(isEdit ? `/policies/${id}` : "/policies")}>
            Cancel
          </Button>
          <Button type="submit" disabled={!canSubmit || saving}>
            <Save className="h-4 w-4" /> {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Policy"}
          </Button>
        </div>
      </form>
    </div>
  );
}
