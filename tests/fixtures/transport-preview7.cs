// Baseline transport scheduling from preview.7, for A/B measurement only.
using System;
using System.Collections.Concurrent;
using System.Threading;
using WebSocketSharp;
using WebSocketSharp.Server;
namespace MzObserver {
public sealed class Feed : WebSocketBehavior {
 internal static Action<Feed,string> Receive;
 internal static readonly ConcurrentDictionary<string,Feed> Clients=new ConcurrentDictionary<string,Feed>();
 internal bool TargetFeedbackEnabled;internal string Observer; internal uint ObserverNetId; internal HudSession Hud;internal string RemoteAddress=>Context.UserEndPoint.Address.ToString();internal int MapRevision=-1;
 private string pending,feedback;private int sending;private Timer timer;private DateTime lastRequest=DateTime.MinValue;
 private readonly ConcurrentQueue<string> control=new ConcurrentQueue<string>();
 protected override void OnOpen(){IgnoreExtensions=true;if(Clients.Count>=16){Context.WebSocket.Close(CloseStatusCode.PolicyViolation,"Connection limit");return;}Clients[ID]=this;timer=new Timer(_=>Pump(),null,0,30);}
 protected override void OnMessage(MessageEventArgs e){if(!e.IsText||e.Data.Length>2048||DateTime.UtcNow-lastRequest<TimeSpan.FromMilliseconds(400))return;lastRequest=DateTime.UtcNow;Receive?.Invoke(this,e.Data);}
 internal void Publish(string json){Interlocked.Exchange(ref pending,json);}
 internal void Feedback(string json){Interlocked.Exchange(ref feedback,json);}
 internal void Control(string json){control.Enqueue(json);}
 void Pump(){if(Interlocked.CompareExchange(ref sending,1,0)!=0)return;string s;if(!control.TryDequeue(out s))s=Interlocked.Exchange(ref pending,null)??Interlocked.Exchange(ref feedback,null);if(s==null){Interlocked.Exchange(ref sending,0);return;}try{SendAsync(s,_=>Interlocked.Exchange(ref sending,0));}catch{Interlocked.Exchange(ref sending,0);}}
 internal void Revoke(){Observer=null;ObserverNetId=0;Interlocked.Exchange(ref pending,null);Interlocked.Exchange(ref feedback,null);try{Context.WebSocket.Close(CloseStatusCode.PolicyViolation,"Observer session ended");}catch{}}
 protected override void OnClose(CloseEventArgs e){Feed f;Clients.TryRemove(ID,out f);timer?.Dispose();}
 protected override void OnError(ErrorEventArgs e){ }
}
}
