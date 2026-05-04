import { ProfileForm } from "@/components/forms/profile-form";
import { PageHeader } from "@/components/layout/page-header";
import { saveProfileAction } from "@/lib/actions/profile";
import { requireUser } from "@/lib/auth/session";

const joinList = (value?: string[] | null) => (value ?? []).join(", ");

export default async function ProfilePage() {
  const user = await requireUser();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Profile"
        title="Edit your targeting preferences"
        description="Keep your profile current so scoring, filtering, and draft generation stay aligned with what you are actually targeting now."
      />
      <ProfileForm
        action={saveProfileAction}
        defaults={{
          fullName: user.fullName,
          phone: user.phone,
          headline: user.headline,
          yearsExperience: user.yearsExperience,
          desiredJobTitles: joinList(user.preferences?.desiredJobTitles),
          preferredIndustries: joinList(user.preferences?.preferredIndustries),
          preferredLocations: joinList(user.preferences?.preferredLocations),
          workModes: user.preferences?.workModes ?? [],
          minimumSalary: user.preferences?.minimumSalary,
          seniorityLevels: user.preferences?.seniorityLevels ?? [],
          topSkills: joinList(user.preferences?.topSkills),
          certifications: joinList(user.preferences?.certifications),
          degree: user.preferences?.degree,
          includeKeywords: joinList(user.preferences?.includeKeywords),
          excludeKeywords: joinList(user.preferences?.excludeKeywords),
          targetCompanies: joinList(user.preferences?.targetCompanies),
          avoidCompanies: joinList(user.preferences?.avoidCompanies),
          prioritizeTrinidad: user.preferences?.prioritizeTrinidad,
          allowCaribbeanRemote: user.preferences?.allowCaribbeanRemote,
          autoHideEnabled: user.preferences?.autoHideEnabled
        }}
      />
    </div>
  );
}
