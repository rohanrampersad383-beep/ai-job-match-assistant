import { ApplicationTable } from "@/components/applications/application-table";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/lib/auth/session";
import { getApplicationTracker } from "@/lib/data/dashboard";

export default async function ApplicationsPage() {
  const user = await requireUser();
  const applications = await getApplicationTracker(user.id);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Applications"
        title="Track manual submissions"
        description="Record what you applied to, when you applied, and where follow-up or interview steps stand."
      />
      {applications.length ? (
        <ApplicationTable applications={applications} />
      ) : (
        <EmptyState
          description="Mark jobs as applied after you complete the submission manually on the employer's site."
          title="No applications tracked yet"
        />
      )}
    </div>
  );
}
