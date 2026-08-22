import type { HostEventFormData } from '../../lib/account'
import {
  formatRecentVenueSubtitle,
  getOrgHiddenGemVenueQuickFill,
  getRecentVenues,
  recentVenueToFormFields,
  type RecentVenue,
  type RecentVenueContext,
} from '../../lib/recentVenues'
import StructuredAddressFields from '../StructuredAddressFields'
import EventBasicsPhotos from './EventBasicsPhotos'
import { FieldHelper, FieldLabel, SectionHeading, TextArea, TextInput } from './CreateEventLayout'

type BasicsStepProps = {
  form: HostEventFormData
  updateForm: (partial: Partial<HostEventFormData>) => void
  venueContext: RecentVenueContext
}

function VenueQuickChip({
  venue,
  title,
  subtitle,
  onSelect,
}: {
  venue: RecentVenue
  title: string
  subtitle: string
  onSelect: (venue: RecentVenue) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(venue)}
      className="min-w-[140px] shrink-0 rounded-[14px] border border-app-subtle bg-app-elevated px-3 py-2.5 text-left transition hover:border-orange/40"
    >
      <p className="truncate text-xs font-bold uppercase text-brown">{title}</p>
      <p className="mt-0.5 truncate text-[10px] text-brown-muted">{subtitle}</p>
    </button>
  )
}

export default function BasicsStep({ form, updateForm, venueContext }: BasicsStepProps) {
  const recentVenues = getRecentVenues(venueContext)
  const hiddenGemQuickFill =
    venueContext.postingAs !== 'personal'
      ? getOrgHiddenGemVenueQuickFill(venueContext.postingAs)
      : null

  function selectVenue(venue: RecentVenue) {
    updateForm(recentVenueToFormFields(venue))
  }

  return (
    <section className="space-y-5 pt-3">
        <div>
          <FieldLabel required>Event Title</FieldLabel>
          <TextInput
            value={form.title}
            onChange={(title) => updateForm({ title })}
            placeholder="e.g. Summer Fest"
          />
        </div>

        <div>
          <FieldLabel>Venue Name</FieldLabel>
          <TextInput
            value={form.venueName}
            onChange={(venueName) => updateForm({ venueName })}
            placeholder="e.g., Community Hall, Tim Hortons, Backyard"
          />
        </div>

        {hiddenGemQuickFill && (
          <div>
            <SectionHeading>Quick fill</SectionHeading>
            <div className="flex gap-2 overflow-x-auto pb-1">
              <VenueQuickChip
                venue={hiddenGemQuickFill.venue}
                title={hiddenGemQuickFill.label}
                subtitle={formatRecentVenueSubtitle(hiddenGemQuickFill.venue)}
                onSelect={selectVenue}
              />
            </div>
          </div>
        )}

        {recentVenues.length > 0 && (
          <div>
            <SectionHeading>Recent venues</SectionHeading>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {recentVenues.map((venue) => (
                <VenueQuickChip
                  key={`${venue.usedAt}-${venue.venueName}`}
                  venue={venue}
                  title={venue.venueName}
                  subtitle={formatRecentVenueSubtitle(venue)}
                  onSelect={selectVenue}
                />
              ))}
            </div>
          </div>
        )}

        <div>
          <StructuredAddressFields
            idPrefix="event"
            value={{
              streetAddress: form.streetAddress,
              streetSuite: form.streetSuite,
              city: form.city,
              province: form.province,
              postalCode: form.postalCode,
              country: form.country,
            }}
            onChange={(address) => updateForm(address)}
          />
        </div>

        <div>
          <FieldLabel required>Description</FieldLabel>
          <TextArea
            value={form.description}
            onChange={(description) => updateForm({ description })}
            placeholder="e.g. Join us for a night of live jazz and curated cocktails..."
            rows={5}
            maxLength={4000}
          />
          <div className="mt-1 flex items-center justify-between">
            <FieldHelper>Minimum 50 characters recommended for better discovery</FieldHelper>
            <FieldHelper>{form.description.length}/4000</FieldHelper>
          </div>
        </div>

        <EventBasicsPhotos
          coverImage={form.coverImage}
          additionalPhotos={form.additionalPhotos}
          onCoverChange={(coverImage) => updateForm({ coverImage })}
          onAdditionalChange={(additionalPhotos) => updateForm({ additionalPhotos })}
        />
    </section>
  )
}
