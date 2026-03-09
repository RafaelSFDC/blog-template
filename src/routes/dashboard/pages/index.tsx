import { createFileRoute } from '@tanstack/react-router'
import { DashboardHeader } from '#/components/dashboard/Header'
import { Library } from 'lucide-react'

export const Route = createFileRoute('/dashboard/pages/')({
  component: PagesManagementPage,
})

function PagesManagementPage() {
  return (
    <div className="space-y-8">
      <DashboardHeader
        title="Pages"
        description="Manage your static pages like About and Contact."
        icon={Library}
        iconLabel="Static Content"
      />
    </div>
  )
}
