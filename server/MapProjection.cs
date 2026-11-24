using System;
namespace MzObserver {
public static class MapProjection {
 // CSS arrow points right at zero; Unity world yaw zero points along +Z (map up).
 public static double Heading(double worldYaw)=>((worldYaw-90)%360+360)%360;
 // 049's annex is ABOVE the HCZ grid (~89 m); the warhead annex is BELOW it.
 public static bool IsOffPlane(string roomName,double worldY,double roomY)=>
  (roomName=="Hcz049"&&worldY>roomY+10)||(roomName=="HczWarhead"&&worldY<roomY-10);
}
}
