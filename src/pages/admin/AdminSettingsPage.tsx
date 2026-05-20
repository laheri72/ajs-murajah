import { useMutation } from "@tanstack/react-query";
import { CheckCircle2, KeyRound, XCircle } from "lucide-react";
import { FormEvent, useState } from "react";
import { AdminPageHeader } from "../../components/dashboard/AdminPageHeader";
import { Button } from "../../components/ui/Button";
import { Card, CardTitle } from "../../components/ui/Card";
import { Input, Label } from "../../components/ui/Input";
import { apiFetch } from "../../lib/api";

const MIN_PASSWORD_LENGTH = 6;

export function AdminSettingsPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const hasNewPassword = newPassword.length > 0;
  const hasConfirmPassword = confirmPassword.length > 0;
  const meetsMinimumLength = newPassword.length >= MIN_PASSWORD_LENGTH;
  const passwordsMatch = newPassword === confirmPassword;

  const updatePassword = useMutation({
    mutationFn: () => apiFetch<{ ok: boolean }>("/api/admin/password", { method: "POST", body: JSON.stringify({ currentPassword, newPassword }) }),
    onSuccess: () => {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
  });
  const canSubmit = Boolean(currentPassword) && meetsMinimumLength && hasConfirmPassword && passwordsMatch && !updatePassword.isPending;

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;
    updatePassword.mutate();
  }

  return (
    <div className="grid gap-5">
      <AdminPageHeader title="Account" description="Manage admin access." />

      <section className="grid gap-4 lg:grid-cols-[minmax(0,620px)_1fr]">
        <Card>
          <div className="mb-5 flex items-center justify-between gap-3">
            <CardTitle>Edit Password</CardTitle>
            <div className="rounded-md bg-gold-soft p-2 text-primary">
              <KeyRound className="h-5 w-5" />
            </div>
          </div>
          <form className="grid gap-4" onSubmit={onSubmit}>
            <div>
              <Label>Current password</Label>
              <Input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} autoComplete="current-password" />
            </div>
            <div>
              <Label>New password</Label>
              <Input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} autoComplete="new-password" aria-describedby="new-password-note" />
              <ValidationNote id="new-password-note" active={hasNewPassword} valid={meetsMinimumLength} text={`Min ${MIN_PASSWORD_LENGTH} characters`} />
            </div>
            <div>
              <Label>Confirm new password</Label>
              <Input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" aria-describedby="confirm-password-note" />
              {hasConfirmPassword ? <ValidationNote id="confirm-password-note" active valid={passwordsMatch} text={passwordsMatch ? "Passwords match" : "Passwords do not match"} /> : null}
            </div>
            {updatePassword.isError ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{updatePassword.error.message}</p> : null}
            {updatePassword.isSuccess ? <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Password updated.</p> : null}
            <Button className="w-full sm:w-fit" disabled={!canSubmit}>
              {updatePassword.isPending ? "Saving..." : "Save password"}
            </Button>
          </form>
        </Card>

        <div className="rounded-lg border border-border bg-white p-4 shadow-soft lg:self-start">
          <p className="text-sm font-semibold text-foreground">Password requirements</p>
          <div className="mt-3 grid gap-2 text-sm">
            <ValidationNote active valid={meetsMinimumLength} text={`Min ${MIN_PASSWORD_LENGTH} characters`} />
            <ValidationNote active={hasConfirmPassword} valid={passwordsMatch && hasConfirmPassword} text="Confirmation matches" />
          </div>
        </div>
      </section>
    </div>
  );
}

function ValidationNote({ id, active, valid, text }: { id?: string; active: boolean; valid: boolean; text: string }) {
  const Icon = valid ? CheckCircle2 : XCircle;
  const tone = valid ? "text-emerald-700" : active ? "text-red-700" : "text-muted-foreground";

  return (
    <p id={id} className={`mt-2 flex items-center gap-2 text-sm ${tone}`}>
      <Icon className="h-4 w-4 shrink-0" />
      <span>{text}</span>
    </p>
  );
}
