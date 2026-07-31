import Combine
import SwiftUI
#if os(macOS)
import AppKit
import AudioToolbox
#else
import UIKit
#endif

struct ContentView: View {
    @Environment(\.horizontalSizeClass) private var horizontalSizeClass
    @State private var now = Date.now

    private let together = Color(red: 0.16, green: 0.16, blue: 0.15)
    private let ink = Color(red: 0.10, green: 0.09, blue: 0.075)
    private let paper = Color(red: 0.961, green: 0.961, blue: 0.961)
    private let clock = Timer.publish(every: 1, on: .main, in: .common).autoconnect()

    private var life: LifeCalendar {
        LifeCalendar(today: now)
    }

    var body: some View {
        ZStack {
            paper.ignoresSafeArea()

            VStack(spacing: 0) {
                header
                calendar
                footer
            }
            .padding(.horizontal, isCompact ? 20 : 64)
            .padding(.top, isCompact ? 14 : 34)
            .padding(.bottom, isCompact ? 10 : 24)
            .frame(maxWidth: 1160, maxHeight: .infinity, alignment: .top)
        }
        .preferredColorScheme(.light)
        .onReceive(clock) { now = $0 }
    }

    private var isCompact: Bool {
        horizontalSizeClass == .compact
    }

    private var rulerWidth: CGFloat {
        isCompact ? 23 : 34
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: isCompact ? 10 : 14) {
            portraits

            Text("Memento amare")
                .font(AppFonts.display(isCompact ? 29 : 42))
                .fontWeight(.semibold)
                .fontWidth(.expanded)
                .tracking(isCompact ? 0.4 : 0.8)
                .foregroundStyle(ink)
                .lineLimit(1)
                .minimumScaleFactor(0.75)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.bottom, isCompact ? 14 : 24)
    }

    private var portraits: some View {
        HStack(spacing: isCompact ? 8 : 12) {
            portrait(name: "Gael", fileExtension: "jpeg")
            portrait(name: "Juanmi", fileExtension: "png")
        }
    }

    private func portrait(name: String, fileExtension: String) -> some View {
        portraitImage(name: name, fileExtension: fileExtension)
            .resizable()
            .scaledToFill()
            .frame(width: isCompact ? 52 : 66, height: isCompact ? 52 : 66)
            .clipShape(Circle())
    }

    private func portraitImage(name: String, fileExtension: String) -> Image {
        guard let url = Bundle.main.url(forResource: name, withExtension: fileExtension) else {
            return Image(systemName: "person.crop.square")
        }
#if os(macOS)
        guard let image = NSImage(contentsOf: url) else {
            return Image(systemName: "person.crop.square")
        }
        return Image(nsImage: image)
#else
        guard let image = UIImage(contentsOfFile: url.path) else {
            return Image(systemName: "person.crop.square")
        }
        return Image(uiImage: image)
#endif
    }

    private var calendar: some View {
        GeometryReader { proxy in
            let rulerHeight: CGFloat = isCompact ? 32 : 38
            let gap: CGFloat = isCompact ? 1 : 2
            let gridWidth = proxy.size.width - rulerWidth
            let cell = (gridWidth - CGFloat(LifeCalendar.weeksPerYear - 1) * gap) / CGFloat(LifeCalendar.weeksPerYear)
            let gridHeight = CGFloat(LifeCalendar.years) * cell + CGFloat(LifeCalendar.years - 1) * gap

            VStack(alignment: .leading, spacing: 4) {
                HStack(alignment: .bottom, spacing: 0) {
                    Text("AÑO")
                        .font(AppFonts.body(isCompact ? 7 : 9, semibold: true))
                        .tracking(0.7)
                        .foregroundStyle(ink.opacity(0.48))
                        .frame(width: rulerWidth)

                    WeekRuler(ink: ink)
                        .frame(width: gridWidth, height: rulerHeight)
                }

                HStack(alignment: .top, spacing: 0) {
                    YearRuler(ink: ink, cell: cell, gap: gap)
                        .frame(width: rulerWidth, height: gridHeight)

                    LazyVGrid(
                        columns: Array(repeating: GridItem(.fixed(cell), spacing: gap), count: LifeCalendar.weeksPerYear),
                        alignment: .leading,
                        spacing: gap
                    ) {
                        ForEach(0..<(LifeCalendar.years * LifeCalendar.weeksPerYear), id: \.self) { index in
                            WeekCell(
                                state: life.state(for: index),
                                isMilestone: life.isMilestoneWeek(index),
                                together: together,
                                paper: paper
                            )
                            .frame(width: cell, height: cell)
#if os(macOS)
                            .help(helpText(for: index))
                            .onHover { isInside in
                                HoverSound.play(isInside: isInside)
                            }
#endif
                        }
                    }
                }
            }
        }
        .aspectRatio(CGFloat(LifeCalendar.weeksPerYear) / CGFloat(LifeCalendar.years), contentMode: .fit)
        .offset(x: -rulerWidth / 2)
    }

    private var footer: some View {
        relationshipCount
            .frame(maxWidth: .infinity, alignment: .center)
        .padding(.top, isCompact ? 8 : 13)
    }

    private var relationshipCount: some View {
        HStack(alignment: .top, spacing: isCompact ? 7 : 11) {
            ForEach(life.relationshipCounter.indices, id: \.self) { index in
                HStack(alignment: .top, spacing: isCompact ? 7 : 11) {
                    VStack(spacing: 5) {
                    Text(life.relationshipCounter[index])
                        .font(AppFonts.display(isCompact ? 16 : 20))
                        .monospacedDigit()
                        .foregroundStyle(ink.opacity(0.78))

                        Text(["DÍAS", "HRS", "MIN", "SEG"][index])
                            .font(AppFonts.body(isCompact ? 6 : 8, semibold: true))
                            .tracking(0.35)
                            .foregroundStyle(ink.opacity(0.42))
                    }

                    if index < life.relationshipCounter.count - 1 {
                        Text(":")
                            .font(AppFonts.display(isCompact ? 14 : 18))
                            .foregroundStyle(ink.opacity(0.38))
                    }
                }
            }
        }
    }

#if os(macOS)
    private func helpText(for index: Int) -> String {
        life.date(for: index).formatted(date: .abbreviated, time: .omitted)
    }
#endif
}

#if os(macOS)
private enum HoverSound {
    static func play(isInside: Bool) {
        AudioServicesPlaySystemSound(isInside ? 1104 : 1103)
    }
}
#endif

private struct WeekRuler: View {
    let ink: Color

    var body: some View {
        GeometryReader { proxy in
            Canvas { context, size in
                for week in 1...LifeCalendar.weeksPerYear {
                    let x = (CGFloat(week) - 0.5) / CGFloat(LifeCalendar.weeksPerYear) * size.width
                    let isMajor = week == 1 || week.isMultiple(of: 5)
                    var tick = Path()
                    tick.move(to: CGPoint(x: x, y: size.height - (isMajor ? 7 : 4)))
                    tick.addLine(to: CGPoint(x: x, y: size.height))
                    context.stroke(
                        tick,
                        with: .color(ink.opacity(isMajor ? 0.55 : 0.25)),
                        lineWidth: isMajor ? 0.8 : 0.5
                    )
                }
            }

            ForEach([1] + Array(stride(from: 5, through: 50, by: 5)), id: \.self) { week in
                Text("\(week)")
                    .font(AppFonts.display(proxy.size.width < 500 ? 6 : 8))
                    .foregroundStyle(ink.opacity(0.58))
                    .position(
                        x: (CGFloat(week) - 0.5) / CGFloat(LifeCalendar.weeksPerYear) * proxy.size.width,
                        y: 7
                    )
            }

            Text("SEMANA")
                .font(AppFonts.body(proxy.size.width < 500 ? 7 : 9, semibold: true))
                .tracking(0.7)
                .foregroundStyle(ink.opacity(0.48))
                .position(x: 25, y: proxy.size.height - 16)
        }
    }
}

private struct YearRuler: View {
    let ink: Color
    let cell: CGFloat
    let gap: CGFloat

    var body: some View {
        GeometryReader { proxy in
            Canvas { context, size in
                for year in 1...LifeCalendar.years {
                    let y = (CGFloat(year) - 0.5) * (cell + gap)
                    let isMajor = year == 1 || year.isMultiple(of: 5)
                    var tick = Path()
                    tick.move(to: CGPoint(x: size.width - (isMajor ? 7 : 4), y: y))
                    tick.addLine(to: CGPoint(x: size.width, y: y))
                    context.stroke(
                        tick,
                        with: .color(ink.opacity(isMajor ? 0.55 : 0.25)),
                        lineWidth: isMajor ? 0.8 : 0.5
                    )
                }
            }

            ForEach([1] + Array(stride(from: 5, through: 90, by: 5)), id: \.self) { year in
                Text("\(year)")
                    .font(AppFonts.display(proxy.size.width < 30 ? 6 : 8))
                    .foregroundStyle(ink.opacity(0.58))
                    .position(
                        x: proxy.size.width / 2 - 2,
                        y: (CGFloat(year) - 0.5) * (cell + gap)
                    )
            }
        }
    }
}

private struct WeekCell: View {
    let state: WeekState
    let isMilestone: Bool
    let together: Color
    let paper: Color

    var body: some View {
        RoundedRectangle(cornerRadius: 1.5)
            .fill(fill)
            .overlay {
                if case .future = state {
                    RoundedRectangle(cornerRadius: 1.5)
                        .stroke(Color.black.opacity(0.13), lineWidth: 0.65)
                }
            }
            .overlay {
                if isMilestone {
                    RoundedRectangle(cornerRadius: 1.5)
                        .stroke(Color.white.opacity(0.95), lineWidth: 1.15)
                        .padding(0.5)
                }
            }
    }

    private var fill: AnyShapeStyle {
        switch state {
        case .completed:
            return AnyShapeStyle(together)
        case .future:
            return AnyShapeStyle(paper)
        }
    }
}

struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
#if os(macOS)
        Group {
            ContentView()
                .frame(width: 390, height: 844)
                .previewDisplayName("iPhone")

            ContentView()
                .frame(width: 1120, height: 820)
                .previewDisplayName("Mac")
        }
#else
        ContentView()
            .previewDisplayName("iPhone")
#endif
    }
}
