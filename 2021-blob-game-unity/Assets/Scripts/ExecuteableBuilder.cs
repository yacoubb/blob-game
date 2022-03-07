#if UNITY_EDITOR
using System;
using System.IO;

using UnityEditor;

using UnityEngine;

public class ExecuteableBuilder
{
  static string GetBuildPathFromCLI(string buildType)
  {
    var buildFolder = Path.Combine(Application.dataPath, $"{buildType}-builds");
    string buildPath = Path.Combine(buildFolder, GetFilenameFromCLI());
    var args = Environment.GetCommandLineArgs();
    for (var i = 0; i < args.Length; i++)
    {
      if (args[i] == "-buildpath")
      {
        buildPath = args[i + 1];
      }
    }

    return buildPath;
  }

  static string GetFilenameFromCLI()
  {
    // read in command line arguments e.g. add "-buildPath some/Path" if you want a different output path 
    var args = Environment.GetCommandLineArgs();
    var filename = "unnamed";
    for (var i = 0; i < args.Length; i++)
    {
      if (args[i] == "-filename")
      {
        filename = args[i + 1];
      }
    }

    return filename;
  }

  static void webgl()
  {

    string[] scenes = {
      "Assets/Scenes/Lobby.unity"
    };

    BuildPipeline.BuildPlayer(scenes, GetBuildPathFromCLI("webgl"), BuildTarget.WebGL, BuildOptions.None);
  }

  static void server()
  {
    string[] scenes = {
      "Assets/Scenes/Lobby.unity"
    };

    EditorUserBuildSettings.standaloneBuildSubtarget = StandaloneBuildSubtarget.Server;
    BuildPipeline.BuildPlayer(scenes, GetBuildPathFromCLI("server"), BuildTarget.StandaloneLinux64, BuildOptions.EnableHeadlessMode);
  }
}
#endif