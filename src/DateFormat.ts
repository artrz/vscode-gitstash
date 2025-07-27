'use strict'

export function toDateTimeIso(date: Date): string {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())} ${getOffset(date)}`
}

export function toDateIso(date: Date): string {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function toFullyReadable(date: Date): string {
    return `${new Intl.DateTimeFormat(Intl.DateTimeFormat().resolvedOptions().locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    }).format(date)} ${getOffset(date)}`
}

export function toDateTimeSmall(date: Date): string {
    return new Intl.DateTimeFormat(Intl.DateTimeFormat().resolvedOptions().locale, {
        year: '2-digit',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: false,
    }).format(date)
}

export function toDateSmall(date: Date): string {
    return new Intl.DateTimeFormat(Intl.DateTimeFormat().resolvedOptions().locale, {
        year: '2-digit',
        month: 'short',
        day: 'numeric',
    }).format(date)
}

export function ago(date: Date): string {
    const units = {
        year: 31536000,
        month: 2630016,
        day: 86400,
        hour: 3600,
        minute: 60,
        second: 1,
    }

    const { value, unit } = ((date: Date) => {
        const secondsElapsed = (Date.now() - date.getTime()) / 1000
        for (const [unit, secondsInUnit] of Object.entries(units)) {
            if (secondsElapsed >= secondsInUnit || unit === 'second') {
                return { value: Math.floor(secondsElapsed / secondsInUnit) * -1, unit }
            }
        }
        return { value: 0, unit: 'second' }
    })(date)

    return (new Intl.RelativeTimeFormat()).format(value, unit as Intl.RelativeTimeFormatUnit)
}

// =============================================================================

function getOffset(date: Date): string {
    const offset = date.getTimezoneOffset()
    const hrs = `0${Math.floor(Math.abs(offset) / 60)}`.slice(-2)
    const mins = `0${Math.abs(offset) % 60}`.slice(-2)

    const readableOffset = `${hrs}${mins}`

    return offset > 0 ? `-${readableOffset}` : readableOffset
}

function pad(n: number): string {
    return n < 10 ? `0${n}` : `${n}`
}
