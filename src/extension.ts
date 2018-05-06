'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "vscodeunitycollab" is now active!');



	var scm = vscode.scm.createSourceControl("vscodeunitycollab","Unity Collab");
	scm.quickDiffProvider = {
		provideOriginalResource: (uri,token) => {
			var workspace = vscode.workspace.getWorkspaceFolder(uri);
			if(!workspace) {
				return undefined;
			}

			var pattern	= new vscode.RelativePattern(workspace,"Library/Collab/Base/" + vscode.workspace.asRelativePath(uri).split("\\").join("/"));
			return vscode.workspace.findFiles(pattern,null,undefined,token).then((files) => {
				return (files && files.length > 0) ? files[0] : undefined;
			});
		}
	};

	var groups = ["Base","Original","Download"].map((path) => {
		var group = scm.createResourceGroup(path,path);
		return new Promise((resolve,reject) => vscode.workspace.findFiles("Library/Collab/" + group.id + "/**/*.*",null).then((files) => {
			group.resourceStates = files.map((orig) => {
				var root = vscode.workspace.getWorkspaceFolder(orig);
				if(root) {
					return [orig,root.uri.with({ path: root.uri.path + "/" + vscode.workspace.asRelativePath(orig).split("\\").join("/").split("/").slice(3).join("/") })];
				}

				return [orig,orig];
			}).map((files) => {
				return {
					resourceUri: files[1],
					command: {
						title: "Diff",
						command: "vscode.diff",
						arguments: Array<any>().concat(files).concat([vscode.workspace.asRelativePath(files[1])])
					}
				};
			});

			resolve();
		}));
	});

	return Promise.all(groups).then(() => {
		vscode.workspace.createFileSystemWatcher("**/*.*").onDidChange((e) => {
			return Promise.all(groups);
		});
	});
}

// this method is called when your extension is deactivated
export function deactivate() {
}
