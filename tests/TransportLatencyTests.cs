using System;using System.Collections.Generic;using System.Diagnostics;using System.Linq;using System.Threading;using System.Net;using System.Net.Sockets;using MzObserver;using WebSocketSharp;using WebSocketSharp.Server;
class TransportLatencyTests {
 static void Main(){var probe=new TcpListener(IPAddress.Loopback,0);probe.Start();int port=((IPEndPoint)probe.LocalEndpoint).Port;probe.Stop();
 var server=new WebSocketServer(IPAddress.Loopback,port);server.AddWebSocketService<Feed>("/mz");Feed feed=null;var ready=new ManualResetEvent(false);var got=new AutoResetEvent(false);long sent=0;var results=new List<double>();
 Feed.Receive=(f,s)=>{feed=f;ready.Set();};server.Start();using(var client=new WebSocket("ws://127.0.0.1:"+port+"/mz")){
 client.OnMessage+=(s,e)=>{lock(results)results.Add((Stopwatch.GetTimestamp()-Interlocked.Read(ref sent))*1000.0/Stopwatch.Frequency);got.Set();};client.Connect();client.Send("pair");if(!ready.WaitOne(3000))throw new Exception("pair timeout");
 for(int i=0;i<60;i++){Thread.Sleep(3+i%13);Interlocked.Exchange(ref sent,Stopwatch.GetTimestamp());feed.Publish("state:"+i);if(!got.WaitOne(3000))throw new Exception("publish timeout");}
 }server.Stop();var a=results.OrderBy(x=>x).ToArray();Console.WriteLine("samples="+a.Length+" medianMs="+a[a.Length/2].ToString("F2")+" p95Ms="+a[(int)(a.Length*.95)].ToString("F2"));}
}
