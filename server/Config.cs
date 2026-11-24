namespace MzObserver {
public sealed class Config {
 public bool Enabled {get;set;}=true;
 public string ListenAddress {get;set;}="0.0.0.0";
 public int Port {get;set;}=28480;
 public int UpdatesPerSecond {get;set;}=20;
 // Legacy config fields, retained for old YAML only. No server settings are registered.
 public int KeybindId {get;set;}=28480;
 public int VisibilityKeybindId {get;set;}=28481;
 public string CertificatePath {get;set;}="";
 public string CertificatePassword {get;set;}="";
 public bool AutomaticScores {get;set;}=true;
 public bool IncludeDummyPlayers {get;set;}=false;
}
}
