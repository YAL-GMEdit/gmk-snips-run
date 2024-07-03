(function() {
	const child_process = require("child_process");
	const Preferences = $gmedit['ui.Preferences'];
	const Dialog = $gmedit['electron.Dialog'];
	function run() {
		if ($gmedit['gml.GmlAPI'].version.name != "gmk-snip") return;
		
		console.log("Starting the runner...");
		let runnerPath = Preferences.current.gmkSnipTesterPath;
		if (runnerPath == null) {
			Dialog.showError("Please set up snippet-tester path in Preferences!");
			return;
		}
		if (!Electron_FS.existsSync(runnerPath)) {
			Dialog.showError(`snippet-tester path "${runnerPath}" doesn't exist!`);
			return;
		}
		
		const project = $gmedit['gml.Project'].current;
		let listFilePath = project.path;
		listFilePath = listFilePath.split("/").join("\\");
		
		const runnerArgs = [
			listFilePath,
		];
		let runner = child_process.spawn(runnerPath, runnerArgs, {
			cwd: project.dir,
		});
		runner.on("spawn", () => {
			console.log("Started up the runner!");
		});
		runner.stdout.on("data", (e) => {
            let text = e.toString();
            console.log(text);
        });
        runner.stderr.on("data", (e) => {
            let text = e.toString();
			console.error(text);
        });
		runner.on("close", (exitCode) => {
			exitCode ??= 0;
			runner = null;
			console.log(`Runner closed, exitCode=${exitCode} (0x${exitCode.toString(16)})`);
		})
	}
	function initCommands() {
		const commands = [{
            name: "gmk-snips-run",
            title: "gmk-snips: Run",
            bindKey: "F5",
            exec: run,
        }];
        
        let hashHandler = $gmedit["ui.KeyboardShortcuts"].hashHandler;
        let AceCommands = $gmedit["ace.AceCommands"];
        for (let cmd of commands) {
            hashHandler.addCommand(cmd);
            AceCommands.add(cmd);
            AceCommands.addToPalette({
                name: cmd.title,
                exec: cmd.name,
            })
        }
	}
	function initPreferences(e) {
		let out = e.target.querySelector('.plugin-settings[for="gmk-snips-run"]');
		let pathEl = Preferences.addInput(out,
			"Path to snippet-tester.exe",
			Preferences.current.gmkSnipTesterPath || "",
		function(str) {
			Preferences.current.gmkSnipTesterPath = str;
			Preferences.save();
		});
		pathEl.querySelector("input").placeholder = "C:\\snippet_tester.exe";
	}
	//
	GMEdit.register("gmk-snips-run", {
		init: function(config) {
			initCommands();
			GMEdit.on("preferencesBuilt", initPreferences);
		}
	});
})();