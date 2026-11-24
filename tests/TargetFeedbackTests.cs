using System;using MzObserver;
class TargetFeedbackTests {
 static void Check(bool value){if(!value)throw new Exception("Target feedback guard failed");}
 static void Main(){foreach(var role in new[]{"Spectator","Overwatch"}){
 var gate=new TargetFeedbackGate();gate.Commit("e",5,"roster-life-role-alive",role,"A",100);
 Check(!gate.Change("e","roster-life-role-alive",role,"A",101));
 Check(!gate.Change("old","roster-life-role-alive",role,"B",102));
 Check(!gate.Change("e","changed-life",""+role,"B",103));
 Check(!gate.Change("e","roster-life-role-alive","NtfPrivate","B",104));
 Check(!gate.Change("e","roster-life-role-alive",role,"B",99));
 Check(gate.Change("e","roster-life-role-alive",role,"B",105));Check(gate.Sequence==5);
 Check(!gate.Change("e","roster-life-role-alive",role,"B",106));
 gate.Commit("e",6,"new-roster",role,"C",110);Check(gate.Change("e","new-roster",role,"A",111));Check(gate.Sequence==6);
 }Console.WriteLine("PASS server feedback gate: roster/life/role changes suppress early confirmations until full baseline");}
}
