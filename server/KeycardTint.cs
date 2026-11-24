using System;using System.Collections.Generic;using System.IO;using System.Linq;using System.Reflection;
using InventorySystem.Items.Keycards;using UnityEngine;
namespace MzObserver {
// Reads the server's existing per-item sync payload. Never regenerates mutable custom-card defaults.
public static class KeycardTint {
 static readonly FieldInfo Database=typeof(KeycardDetailSynchronizer).GetField("Database",BindingFlags.Static|BindingFlags.NonPublic);
 public static string Get(LabApi.Features.Wrappers.KeycardItem card){
  if(card==null)return null;
  foreach(var d in card.Base.Details.OfType<PredefinedTintDetail>()){
   var color=Collector.Read(d,"_color");if(color is Color c){Color32 b=c;return "#"+b.r.ToString("X2")+b.g.ToString("X2")+b.b.ToString("X2");}
  }
  if(!card.Base.Details.Any(d=>d is CustomTintDetail))return null;
  var db=Database?.GetValue(null) as Dictionary<ushort,ArraySegment<byte>>;ArraySegment<byte> bytes;
  if(db==null||!db.TryGetValue(card.Serial,out bytes))return null;
  return TintPayload.Read(bytes,card.Base.Details.OfType<SyncedDetail>().Select(d=>d.GetType().Name));
 }
}
}
