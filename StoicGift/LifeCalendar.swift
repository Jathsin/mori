import Foundation

struct LifeCalendar {
    static let years = 90
    static let weeksPerYear = 52

    let myBirth: Date
    let partnerBirth: Date
    let meetingDate: Date
    let today: Date

    init(today: Date = .now) {
        myBirth = Self.makeDate(2005, 1, 15)
        partnerBirth = Self.makeDate(2005, 5, 26)
        meetingDate = Self.makeDate(2024, 11, 14)
        self.today = today
    }

    var relationshipDays: Int {
        max(0, Calendar.current.dateComponents([.day], from: meetingDate, to: today).day ?? 0)
    }

    var relationshipText: String {
        let components = Calendar.current.dateComponents([.year, .month, .day], from: meetingDate, to: today)
        let year = components.year ?? 0
        let month = components.month ?? 0
        let day = components.day ?? 0
        return "\(year) año\(year == 1 ? "" : "s"), \(month) mes\(month == 1 ? "" : "es"), \(day) día\(day == 1 ? "" : "s")"
    }

    var relationshipCounter: [String] {
        let totalSeconds = max(0, Int(today.timeIntervalSince(meetingDate)))
        let days = totalSeconds / 86_400
        let hours = (totalSeconds % 86_400) / 3_600
        let minutes = (totalSeconds % 3_600) / 60
        let seconds = totalSeconds % 60
        return [
            String(format: "%03d", days),
            String(format: "%02d", hours),
            String(format: "%02d", minutes),
            String(format: "%02d", seconds)
        ]
    }

    func date(for index: Int) -> Date {
        Calendar.current.date(byAdding: .weekOfYear, value: index, to: myBirth) ?? myBirth
    }

    func state(for index: Int) -> WeekState {
        let week = date(for: index)
        if week > today { return .future }
        return .completed
    }

    func isMilestoneWeek(_ index: Int) -> Bool {
        let weekStart = date(for: index)
        let weekEnd = Calendar.current.date(byAdding: .day, value: 7, to: weekStart) ?? weekStart
        let milestones = [
            myBirth,
            partnerBirth,
            meetingDate,
            Self.makeDate(2026, 6, 1)
        ]
        return milestones.contains { $0 >= weekStart && $0 < weekEnd }
    }

    private static func makeDate(_ year: Int, _ month: Int, _ day: Int) -> Date {
        Calendar(identifier: .gregorian).date(
            from: DateComponents(timeZone: TimeZone(secondsFromGMT: 0), year: year, month: month, day: day)
        )!
    }
}

enum WeekState {
    case completed
    case future
}
