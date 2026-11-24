using System;using System.Collections.Generic;using System.Threading;using System.Net;using System.Net.Sockets;using MzObserver;using WebSocketSharp;using WebSocketSharp.Server;
class TransportTests {
 static void Main(){
  var probe=new TcpListener(IPAddress.Loopback,0);probe.Start();int port=((IPEndPoint)probe.LocalEndpoint).Port;probe.Stop();
  var server=new WebSocketServer(IPAddress.Loopback,port);server.AddWebSocketService<Feed>("/mz");
  Feed feed=null;var messages=new List<string>();var got=new ManualResetEvent(false);var closed=new ManualResetEvent(false);var feedbackGot=new ManualResetEvent(false);
  Feed.Receive=(f,s)=>{feed=f;f.Control("authenticated");f.Control("layout");for(int i=0;i<100;i++)f.Publish("state:"+i);};
  server.Start();using(var client=new WebSocket("ws://127.0.0.1:"+port+"/mz")){
   client.OnMessage+=(s,e)=>{lock(messages){messages.Add(e.Data);if(e.Data=="state:99")got.Set();if(e.Data=="feedback:latest")feedbackGot.Set();}};client.OnClose+=(s,e)=>closed.Set();
   client.Connect();client.Send("pair");if(!got.WaitOne(4000))throw new Exception("transport timeout");
   lock(messages){if(messages.Count<3||messages[0]!="authenticated"||messages[1]!="layout"||messages[messages.Count-1]!="state:99")throw new Exception("lost ordered control or latest state");}
   feed.Feedback("feedback:latest");if(!feedbackGot.WaitOne(2000))throw new Exception("feedback drain timeout");
   feed.Revoke();if(!closed.WaitOne(2000))throw new Exception("revoke failed");
  }server.Stop();Console.WriteLine("PASS WebSocket control ordering, latest snapshot and revocation");
 }
}
