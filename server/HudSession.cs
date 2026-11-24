using System;
using System.Security.Cryptography;
namespace MzObserver {
// Shared by the one-use permit and reconnect token; independent of the player's current role.
public sealed class HudSession {
 public bool Visible=true,Zoom;
 bool visibilityPressed,zoomPressed;
 public void Key(bool visibility,bool pressed){
  if(visibility){if(pressed&&!visibilityPressed)Visible=!Visible;visibilityPressed=pressed;}
  else {if(pressed&&!zoomPressed)Zoom=!Zoom;zoomPressed=pressed;}
 }
 public void ReleaseKeys(){visibilityPressed=false;zoomPressed=false;}
}
public static class PairingCode {
 public static string Create(Func<string,bool> occupied){
  using(var rng=RandomNumberGenerator.Create()){
   var bytes=new byte[2];for(int attempt=0;attempt<100000;attempt++){
    rng.GetBytes(bytes);int value=bytes[0]*256+bytes[1];if(value>=60000)continue;
    var code=(value%10000).ToString("D4");if(!occupied(code))return code;
   }
  }throw new InvalidOperationException("暂时无法生成配对码，请稍后重试");
 }
}
}
