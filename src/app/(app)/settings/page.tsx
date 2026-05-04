import { SettingsForm } from "@/components/forms/settings-form";
import { PageHeader } from "@/components/layout/page-header";
import { saveScoringSettingsAction } from "@/lib/actions/settings";
import { requireUser } from "@/lib/auth/session";

const joinList = (value?: string[] | null) => (value ?? []).join(", ");

export default async function SettingsPage() {
  const user = await requireUser();
  const defaults = user.scoringSettings;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Settings"
        title="Adjust the scoring engine"
        description="Tune the weighting model, add organization-wide include/exclude keywords, and set the threshold for auto-hidden low-fit jobs."
      />
      <SettingsForm
        action={saveScoringSettingsAction}
        defaults={{
          titleWeight: defaults?.titleWeight,
          skillsWeight: defaults?.skillsWeight,
          experienceWeight: defaults?.experienceWeight,
          educationWeight: defaults?.educationWeight,
          locationWeight: defaults?.locationWeight,
          remoteWeight: defaults?.remoteWeight,
          trinidadBoostWeight: defaults?.trinidadBoostWeight,
          sourceTrustWeight: defaults?.sourceTrustWeight,
          salaryWeight: defaults?.salaryWeight,
          certificationsWeight: defaults?.certificationsWeight,
          keywordWeight: defaults?.keywordWeight,
          blacklistPenalty: defaults?.blacklistPenalty,
          mismatchPenalty: defaults?.mismatchPenalty,
          autoHideMinMatchPercent: defaults?.autoHideMinMatchPercent,
          targetJobFamilies: joinList(defaults?.targetJobFamilies),
          includeKeywords: joinList(defaults?.includeKeywords),
          excludeKeywords: joinList(defaults?.excludeKeywords)
        }}
      />
    </div>
  );
}
