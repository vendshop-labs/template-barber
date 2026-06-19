'use client';

import { useState, useCallback } from 'react';
import { SERVICE_OPTIONS, BARBERS, WHATSAPP_NUMBER } from '@/lib/constants';
import WhatsAppIcon from '@/components/ui/WhatsAppIcon';
import GoldDivider from '@/components/ui/GoldDivider';
import DateTimePicker from '@/components/ui/DateTimePicker';
import ScrollReveal from '@/components/ui/ScrollReveal';

export default function BookingSection() {
  const [selectedDate, setSelectedDate]   = useState('');
  const [selectedTime, setSelectedTime]   = useState('');
  const [bookedSlots, setBookedSlots]     = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots]   = useState(false);
  const [submitting, setSubmitting]       = useState(false);
  const [submitError, setSubmitError]     = useState('');

  // Fetch booked slots when day changes
  const handleDayChange = useCallback(async (date: string) => {
    setSelectedTime('');
    setLoadingSlots(true);
    try {
      const res = await fetch(`/api/appointments?mode=slots&date=${date}`);
      const slots = (await res.json()) as string[];
      setBookedSlots(slots);
    } catch {
      setBookedSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }, []);

  const handleDateTimeSelect = (date: string, time: string) => {
    setSelectedDate(date);
    setSelectedTime(time);
    setSubmitError('');
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);

    const name    = String(data.get('name')    ?? '').trim();
    const phone   = String(data.get('phone')   ?? '').trim();
    const service = String(data.get('service') ?? '').trim();
    const barber  = String(data.get('barber')  ?? '').trim();
    const note    = String(data.get('note')    ?? '').trim();

    if (!selectedDate || !selectedTime) {
      setSubmitError('Vyberte deň a čas rezervácie.');
      return;
    }
    if (!name || !phone) {
      setSubmitError('Vyplňte meno a telefón.');
      return;
    }

    setSubmitting(true);
    setSubmitError('');

    try {
      // 1. Save to DB
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName:  name,
          clientPhone: phone,
          date:        selectedDate,
          time:        selectedTime,
          notes:       note || null,
        }),
      });

      if (res.status === 409) {
        // Slot taken — reload and show error
        const slotsRes = await fetch(`/api/appointments?mode=slots&date=${selectedDate}`);
        setBookedSlots((await slotsRes.json()) as string[]);
        setSelectedTime('');
        setSubmitError('Tento termín bol medzičasom obsadený. Vyberte iný čas.');
        setSubmitting(false);
        return;
      }

      if (!res.ok) {
        setSubmitError('Chyba pri ukladaní. Skúste znovu.');
        setSubmitting(false);
        return;
      }

      // 2. Optimistically mark slot as booked
      setBookedSlots((prev) => [...prev, selectedTime]);

      // 3. Open WhatsApp with pre-filled message
      const lines = [
        `📅 *Rezervácia — Kate Barber Studio*`,
        `━━━━━━━━━━━━━━━━━━`,
        `👤 ${name}  📞 ${phone}`,
        service ? `✂️ ${service}` : '',
        barber  ? `💈 ${barber}` : '',
        `📆 ${selectedDate}  🕐 ${selectedTime}`,
        note    ? `💬 ${note}` : '',
        `━━━━━━━━━━━━━━━━━━`,
      ].filter(Boolean).join('\n');

      window.open(
        `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines)}`,
        '_blank',
        'noopener,noreferrer',
      );

      // Reset form
      form.reset();
      setSelectedDate('');
      setSelectedTime('');
    } catch {
      setSubmitError('Sieťová chyba. Skúste znovu.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section id="rezervacia" className="booking">
      <ScrollReveal direction="up" className="section-header">
        <p className="section-label">Rezervácia</p>
        <h2 className="section-title">Zarezervujte si termín</h2>
        <GoldDivider />
        <p className="section-subtitle">
          Vyplňte formulár — uložíme termín a otvoríme WhatsApp s potvrdením.
        </p>
      </ScrollReveal>

      <ScrollReveal direction="up" delay={200}>
        <div className="booking__container">
          <form onSubmit={handleSubmit} className="booking__form">

            <div className="booking__form-row">
              <div>
                <label className="booking__label">Služba</label>
                <select name="service" required className="booking__select">
                  <option value="">Vyberte službu...</option>
                  {SERVICE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="booking__label">Barber</label>
                <select name="barber" className="booking__select">
                  <option value="">Bez preferencie</option>
                  {BARBERS.map((barber) => (
                    <option key={barber} value={barber}>{barber}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="booking__label">
                Vyberte deň a čas
                {loadingSlots && (
                  <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem', opacity: 0.6 }}>
                    načítavam dostupnosť...
                  </span>
                )}
              </label>
              <div className="booking__picker-wrap">
                <DateTimePicker
                  onSelect={handleDateTimeSelect}
                  onDayChange={handleDayChange}
                  bookedSlots={bookedSlots}
                />
              </div>
            </div>

            <div className="booking__form-row">
              <div>
                <label className="booking__label">Meno</label>
                <input
                  type="text"
                  name="name"
                  placeholder="Vaše meno"
                  required
                  className="booking__input"
                />
              </div>
              <div>
                <label className="booking__label">Telefón</label>
                <input
                  type="tel"
                  name="phone"
                  placeholder="+421 9XX XXX XXX"
                  required
                  className="booking__input"
                />
              </div>
            </div>

            <div>
              <label className="booking__label">Poznámka (nepovinné)</label>
              <textarea
                name="note"
                placeholder="Špeciálne požiadavky alebo poznámky..."
                className="booking__textarea"
              />
            </div>

            {submitError && (
              <p style={{ color: '#f87171', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                ⚠️ {submitError}
              </p>
            )}

            <div className="booking__actions">
              <button
                type="submit"
                className="booking__btn-wa booking__btn-full"
                disabled={submitting}
              >
                <WhatsAppIcon size={18} />
                {submitting ? 'Ukladám...' : 'Odoslať cez WhatsApp'}
              </button>
            </div>
          </form>

          <p className="booking__note">
            Termín sa uloží do systému. Po kliknutí sa otvorí WhatsApp s potvrdením. Odpovedáme do 30 minút.
          </p>
        </div>
      </ScrollReveal>
    </section>
  );
}
