import CoreText
import SwiftUI

enum AppFonts {
    static func register() {
        ["UnicaOne-Regular", "CrimsonText-Regular", "CrimsonText-SemiBold", "Caveat", "Kalam-Regular", "Kalam-Bold", "Inter"].forEach { name in
            guard let url = Bundle.main.url(forResource: name, withExtension: "ttf") else { return }
            CTFontManagerRegisterFontsForURL(url as CFURL, .process, nil)
        }
    }

    static func display(_ size: CGFloat) -> Font {
        .custom("Inter-Regular", size: size).weight(.medium)
    }

    static func body(_ size: CGFloat, semibold: Bool = false) -> Font {
        .custom("Inter-Regular", size: size).weight(semibold ? .semibold : .regular)
    }
}
