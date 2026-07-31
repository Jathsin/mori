import SwiftUI

@main
struct StoicGiftApp: App {
    init() {
        AppFonts.register()
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
#if os(macOS)
                .frame(minWidth: 900, minHeight: 720)
#endif
        }
#if os(macOS)
        .windowStyle(.hiddenTitleBar)
        .defaultSize(width: 1120, height: 820)
#endif
    }
}
