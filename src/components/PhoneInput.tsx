import { useEffect, useState, type InputHTMLAttributes } from 'react'
import { formatPhoneDisplay, parsePhoneDigits } from '../lib/phoneFormat'

type PhoneInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'value' | 'onChange' | 'inputMode'
> & {
  /** Normalized 10-digit string (or legacy formatted value — parsed on load). */
  value: string
  onChange: (digits: string) => void
}

export default function PhoneInput({
  value,
  onChange,
  className,
  placeholder = '(306) 555-1234',
  readOnly,
  disabled,
  ...rest
}: PhoneInputProps) {
  const [display, setDisplay] = useState(() => formatPhoneDisplay(value))

  useEffect(() => {
    setDisplay(formatPhoneDisplay(value))
  }, [value])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = parsePhoneDigits(e.target.value).slice(0, 10)
    setDisplay(formatPhoneDisplay(digits))
    onChange(digits)
  }

  return (
    <input
      {...rest}
      type="tel"
      inputMode="tel"
      autoComplete="tel"
      enterKeyHint="done"
      value={display}
      onChange={handleChange}
      readOnly={readOnly}
      disabled={disabled}
      placeholder={placeholder}
      className={className}
    />
  )
}
