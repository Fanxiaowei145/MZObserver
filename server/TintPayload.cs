using System;using System.IO;using System.Collections.Generic;
namespace MzObserver {
public static class TintPayload {
 static void SkipString(BinaryReader reader){int size=reader.ReadUInt16();if(size>0&&reader.ReadBytes(size-1).Length!=size-1)throw new EndOfStreamException();}
 public static string Read(ArraySegment<byte> bytes,IEnumerable<string> details){
  if(bytes.Array==null)return null;
  try{using(var stream=new MemoryStream(bytes.Array,bytes.Offset,bytes.Count,false))using(var r=new BinaryReader(stream))foreach(var name in details){
   switch(name){
    case "CustomTintDetail":var red=r.ReadByte();var green=r.ReadByte();var blue=r.ReadByte();r.ReadByte();return "#"+red.ToString("X2")+green.ToString("X2")+blue.ToString("X2");
    case "CustomItemNameDetail":case "NametagDetail":case "CustomSerialNumberDetail":SkipString(r);break;
    case "CustomLabelDetail":SkipString(r);r.ReadUInt32();break;
    case "CustomPermsDetail":r.ReadUInt16();if(r.ReadByte()!=0)r.ReadUInt32();break;
    case "CustomRankDetail":case "CustomWearDetail":r.ReadByte();break;
    case "SerialNumberDetail":r.ReadUInt64();r.ReadByte();break;
    default:return null; // Future unknown payload shapes cannot be safely skipped.
   }
  }}catch(EndOfStreamException){return null;}return null;
 }
}
}
