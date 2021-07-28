'use strict'

export default class {
    public static toDateTimeIso(date: Date): string {
        return `${date.getFullYear()}-${this.pad(date.getMonth() + 1)}-${this.pad(date.getDate())} ${
            this.pad(date.getHours())}:${this.pad(date.getMinutes())}:${this.pad(date.getSeconds())} ${
            this.getOffset(date)}`
    }

    public static toDateIso(date: Date): string {
        return `${date.getFullYear()}-${this.pad(date.getMonth() + 1)}-${this.pad(date.getDate())}`
    }

    public static toFullyReadable(date: Date): string {
        return `${new Intl.DateTimeFormat(Intl.DateTimeFormat().resolvedOptions().locale, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }).format(date)} ${this.getOffset(date)}`
    }

    public static toDateTimeSmall(date: Date): string {
        return new Intl.DateTimeFormat(Intl.DateTimeFormat().resolvedOptions().locale, {
            year: '2-digit',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            hour12: false,
        }).format(date)
    }

    public static toDateSmall(date: Date): string {
        return new Intl.DateTimeFormat(Intl.DateTimeFormat().resolvedOptions().locale, {
            year: '2-digit',
            month: 'short',
            day: 'numeric',
        }).format(date)
    }

    public static ago(date: Date): string {
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
        })(date)

        return (new Intl.RelativeTimeFormat()).format(value, unit as Intl.RelativeTimeFormatUnit)
    }

    private static getOffset(date: Date): string {
        const offset = date.getTimezoneOffset()
        const hrs = `0${Math.floor(Math.abs(offset) / 60)}`.slice(-2)
        const mins = `0${Math.abs(offset) % 60}`.slice(-2)

        const readableOffset = `${hrs}${mins}`

        return offset > 0 ? `-${readableOffset}` : readableOffset
    }

    private static pad(n: number): string {
        return n < 10 ? `0${n}` : `${n}`
    }
}
