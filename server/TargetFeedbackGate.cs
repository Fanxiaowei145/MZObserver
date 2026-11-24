namespace MzObserver {
// Bind every early target update to the exact full roster snapshot it extends.
public sealed class TargetFeedbackGate {
 public string Epoch,Role,Roster,Target;public long Sequence;public double Time;
 public void Commit(string epoch,long sequence,string roster,string role,string target,double time){Epoch=epoch;Sequence=sequence;Roster=roster;Role=role;Target=target;Time=time;}
 public bool Change(string epoch,string roster,string role,string target,double time){
  if(Epoch!=epoch||Roster!=roster||Role!=role||time<=Time||Target==target)return false;
  Target=target;Time=time;return true;
 }
}
}
