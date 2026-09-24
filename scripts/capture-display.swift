// Display-mode helper for capture-hidpi.sh. Requires macOS and Xcode CLI tools.
import CoreGraphics
import Foundation

struct SavedMode: Codable {
    let display: CGDirectDisplayID
    let mode: Int32
}

func modes(_ display: CGDirectDisplayID) -> [CGDisplayMode] {
    CGDisplayCopyAllDisplayModes(display,
        [kCGDisplayShowDuplicateLowResolutionModes: true] as CFDictionary) as? [CGDisplayMode] ?? []
}

func describe(_ mode: CGDisplayMode) -> String {
    "\(mode.width)×\(mode.height) workspace, \(mode.pixelWidth)×\(mode.pixelHeight) pixels, \(mode.refreshRate) Hz"
}

func fail(_ message: String) -> NSError {
    NSError(domain: "Kindling capture", code: 1,
        userInfo: [NSLocalizedDescriptionKey: message])
}

func apply(_ mode: CGDisplayMode, to display: CGDirectDisplayID) throws {
    var config: CGDisplayConfigRef?
    guard CGBeginDisplayConfiguration(&config) == .success else {
        throw fail("Could not begin display configuration")
    }
    guard CGConfigureDisplayWithDisplayMode(config, display, mode, nil) == .success else {
        CGCancelDisplayConfiguration(config)
        throw fail("Could not configure the display mode")
    }
    guard CGCompleteDisplayConfiguration(config, .forSession) == .success else {
        throw fail("Could not apply the display mode")
    }
}

do {
    let args = Array(CommandLine.arguments.dropFirst())
    guard let action = args.first, ["inspect", "begin", "restore"].contains(action),
          action == "inspect" || args.count == 2 else {
        throw fail("Usage: capture-display inspect | begin STATE_FILE | restore STATE_FILE")
    }
    if action == "restore" {
        let saved = try JSONDecoder().decode(SavedMode.self,
            from: Data(contentsOf: URL(fileURLWithPath: args[1])))
        guard CGDisplayIsOnline(saved.display) != 0,
              let original = modes(saved.display).first(where: { $0.ioDisplayModeID == saved.mode }) else {
            throw fail("Original display/mode is unavailable. Reconnect the display and retry restoration.")
        }
        if CGDisplayCopyDisplayMode(saved.display)?.ioDisplayModeID != saved.mode {
            try apply(original, to: saved.display)
        }
        print("Restored: \(describe(original))")
    } else {
        let display = CGMainDisplayID()
        guard let original = CGDisplayCopyDisplayMode(display) else {
            throw fail("Could not read the main display mode")
        }
        func suitable(_ mode: CGDisplayMode) -> Bool {
            mode.pixelWidth == mode.width * 2 && mode.pixelHeight == mode.height * 2 &&
            mode.width >= 1200 && mode.height >= 1000
        }
        // Preserve physical resolution and refresh rate; change only UI scaling.
        let chosen = suitable(original) ? original : modes(display).first(where: {
            suitable($0) && $0.pixelWidth == original.pixelWidth &&
            $0.pixelHeight == original.pixelHeight && abs($0.refreshRate - original.refreshRate) < 1
        })
        print("Current: \(describe(original))")
        guard let target = chosen else {
            throw fail("No matching 2× HiDPI mode with a workspace of at least 1200×1000. Use a suitable display; screenshots will not be upscaled.")
        }
        print("Capture: \(describe(target))")
        if action == "begin" {
            let state = URL(fileURLWithPath: args[1])
            guard !FileManager.default.fileExists(atPath: state.path) else {
                throw fail("Refusing to overwrite an existing display recovery file")
            }
            // Record the original mode before changing anything.
            try JSONEncoder().encode(SavedMode(display: display, mode: original.ioDisplayModeID))
                .write(to: state, options: .atomic)
            if target.ioDisplayModeID != original.ioDisplayModeID {
                try apply(target, to: display)
            }
        }
    }
} catch {
    fputs("\(error.localizedDescription)\n", stderr)
    exit(1)
}
