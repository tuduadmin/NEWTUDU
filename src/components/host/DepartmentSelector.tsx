import { Link } from 'react-router-dom'
import { getOrgDepartments } from '../../lib/account'
import { FieldLabel } from '../create-event/CreateEventLayout'

type DepartmentSelectorProps = {
  orgId: string
  value: string
  onChange: (departmentId: string) => void
}

export default function DepartmentSelector({ orgId, value, onChange }: DepartmentSelectorProps) {
  const departments = getOrgDepartments(orgId)

  return (
    <div className="mt-3 rounded-[14px] border border-brown/10 bg-white p-4 shadow-sm">
      <FieldLabel>Department (optional)</FieldLabel>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-[14px] border border-brown/20 bg-white px-3 py-2.5 text-sm font-semibold text-brown outline-none focus:border-purple focus:ring-2 focus:ring-purple/20"
      >
        <option value="">General (org-wide)</option>
        {departments.map((dept) => (
          <option key={dept.id} value={dept.id}>
            {dept.name}
          </option>
        ))}
      </select>
      <p className="mt-2 text-xs leading-relaxed text-brown-muted">
        e.g. Social Club, Public Education - leave as General for org-wide events.
      </p>
      {departments.length === 0 && (
        <p className="mt-1 text-xs text-brown-muted">
          No departments yet.{' '}
          <Link to="/host/departments" className="font-semibold text-orange no-underline">
            Add departments
          </Link>
        </p>
      )}
    </div>
  )
}
