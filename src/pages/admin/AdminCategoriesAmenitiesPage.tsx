import { EVENT_CATEGORIES } from '../../data/eventCategories'
import { listRegistryAmenitiesForAdmin } from '../../data/amenityIconRegistry'
import { AmenityIconById } from '../../lib/amenityIcons'
import { AdminBadge, AdminPageHeader, AdminPanel, AdminTable } from '../../components/admin/AdminUI'

export default function AdminCategoriesAmenitiesPage() {
  const amenities = listRegistryAmenitiesForAdmin()

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <AdminPageHeader
        title="Categories & Amenities"
        subtitle="Locked icon registry — source of truth for event categories and amenity chips across Discover, create-event, and landing cards."
      />

      <AdminPanel className="border-[var(--admin-accent)]/20">
        <p className="admin-label text-[var(--admin-accent)]">How to change icons</p>
        <p className="mt-2 text-xs leading-relaxed text-[var(--admin-text-muted)]">
          Icons are defined in code at{' '}
          <code className="text-[var(--admin-text-dim)]">src/data/amenityIconRegistry.ts</code> (amenities)
          and{' '}
          <code className="text-[var(--admin-text-dim)]">src/data/eventCategories.ts</code> (categories).
          Update those files, then verify on this page. Phase 2 will add an interactive picker here.
        </p>
      </AdminPanel>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-[var(--admin-text)]">Event categories</h2>
        <AdminTable columns={['Category', 'ID', 'Icon (Heroicons solid)', 'Subcategories']}>
          {EVENT_CATEGORIES.map((cat) => {
            const Icon = cat.icon
            return (
              <tr key={cat.id}>
                <td className="font-medium">{cat.label}</td>
                <td>
                  <code className="text-[10px] text-[var(--admin-text-dim)]">{cat.id}</code>
                </td>
                <td>
                  <span className="inline-flex items-center gap-2 text-[var(--admin-accent)]">
                    <Icon width={20} height={20} aria-hidden />
                    <AdminBadge tone="neutral">locked</AdminBadge>
                  </span>
                </td>
                <td className="max-w-xs text-xs text-[var(--admin-text-muted)]">
                  {cat.subcategories.length} subcategories
                </td>
              </tr>
            )
          })}
        </AdminTable>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-[var(--admin-text)]">Event amenities</h2>
        <AdminTable columns={['Amenity', 'ID', 'Solid', 'Outline preview', 'Heroicon']}>
          {amenities.map((a) => (
            <tr key={a.id}>
              <td>
                <div>
                  <p className="font-medium">{a.label}</p>
                  {a.group && (
                    <p className="text-[10px] text-[var(--admin-text-dim)]">{a.group}</p>
                  )}
                </div>
              </td>
              <td>
                <code className="text-[10px] text-[var(--admin-text-dim)]">{a.id}</code>
              </td>
              <td>
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--admin-radius)] bg-white/5 text-[var(--admin-accent)]">
                  <AmenityIconById id={a.id} size={18} iconVariant="solid" />
                </span>
              </td>
              <td>
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--admin-radius)] bg-white/5 text-orange-400">
                  <AmenityIconById id={a.id} size={18} iconVariant="outline" />
                </span>
              </td>
              <td>
                <code className="text-[10px] text-[var(--admin-text-muted)]">{a.solidIconId}</code>{' '}
                <AdminBadge tone="neutral">locked</AdminBadge>
              </td>
            </tr>
          ))}
        </AdminTable>
      </section>
    </div>
  )
}
