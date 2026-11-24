using System;using System.Diagnostics;using System.Runtime.InteropServices;using System.Threading;
class KeyEdges {
 bool previousVisibility,previousZoom,previousRotation;
 public int Poll(bool focused,bool modifiers,bool visibility,bool zoom,bool rotation=false){int result=0;if(focused&&!modifiers){if(visibility&&!previousVisibility)result|=1;if(zoom&&!previousZoom)result|=2;if(rotation&&!previousRotation)result|=4;}previousVisibility=visibility;previousZoom=zoom;previousRotation=rotation;return result;}
 public void Prime(bool visibility,bool zoom,bool rotation=false){previousVisibility=visibility;previousZoom=zoom;previousRotation=rotation;}
}
class NumberEdges {
 readonly bool[] top=new bool[9],pad=new bool[9];
 public bool Poll(int i,bool a,bool b,bool allowed){bool pressed=allowed&&((a&&!top[i])||(b&&!pad[i]));top[i]=a;pad[i]=b;return pressed;}
 public void Prime(int i,bool a,bool b){top[i]=a;pad[i]=b;}
}
// Spectator/OW can keep the OS cursor visible even with all menus closed.
class SwitchInputGate {
 public static bool CanTap(bool enabled,long now,long armedUntil,long lastTap,bool focus,bool hidden,bool manual,bool modifiers){return enabled&&now<armedUntil&&now-lastTap>=20&&focus&&!manual&&!modifiers;}
}
class WindowTracker {
 [StructLayout(LayoutKind.Sequential)]struct RECT{public int Left,Top,Right,Bottom;}
 [StructLayout(LayoutKind.Sequential)]struct POINT{public int X,Y;}
 [DllImport("user32.dll")]static extern bool GetClientRect(IntPtr h,out RECT r);
 [DllImport("user32.dll")]static extern bool ClientToScreen(IntPtr h,ref POINT p);
 [DllImport("user32.dll")]static extern IntPtr GetForegroundWindow();
 [DllImport("user32.dll")]static extern bool IsIconic(IntPtr h);
 [DllImport("user32.dll")]static extern bool IsWindowVisible(IntPtr h);
 [DllImport("user32.dll")]static extern bool SetProcessDpiAwarenessContext(IntPtr p);
 [DllImport("user32.dll")]static extern short GetAsyncKeyState(int key);
 [DllImport("winmm.dll")]static extern uint timeBeginPeriod(uint period);
 [DllImport("winmm.dll")]static extern uint timeEndPeriod(uint period);
 static bool preciseTimer;
 static void SetPreciseTimer(bool enabled){if(enabled&&!preciseTimer)preciseTimer=timeBeginPeriod(1)==0;else if(!enabled&&preciseTimer){timeEndPeriod(1);preciseTimer=false;}}
 static int visibilityKey,zoomKey,rotationKey,revision;
 static readonly System.Collections.Concurrent.ConcurrentQueue<string> switchCommands=new System.Collections.Concurrent.ConcurrentQueue<string>();
 [StructLayout(LayoutKind.Sequential)]struct CURSORINFO{public int cbSize,flags;public IntPtr cursor;public POINT pos;}
 [DllImport("user32.dll")]static extern bool GetCursorInfo(ref CURSORINFO info);
 [StructLayout(LayoutKind.Sequential)]struct MOUSEINPUT{public int dx,dy;public uint mouseData,dwFlags,time;public UIntPtr extra;}
 [StructLayout(LayoutKind.Sequential)]struct KEYBDINPUT{public ushort vk,scan;public uint flags,time;public UIntPtr extra;}
 [StructLayout(LayoutKind.Explicit)]struct INPUTUNION{[FieldOffset(0)]public MOUSEINPUT mouse;[FieldOffset(0)]public KEYBDINPUT key;}
 [StructLayout(LayoutKind.Sequential)]struct INPUT{public uint type;public INPUTUNION data;}
 [DllImport("user32.dll",SetLastError=true)]static extern uint SendInput(uint count,INPUT[] input,int size);
 static bool CursorHidden(){var c=new CURSORINFO{cbSize=Marshal.SizeOf(typeof(CURSORINFO))};return GetCursorInfo(ref c)&&(c.flags&1)==0;}
 static bool Tap(int key){var pair=new INPUT[2];for(int i=0;i<2;i++){if(key==1||key==2){pair[i].type=0;pair[i].data.mouse.dwFlags=(uint)(key==1?(i==0?2:4):(i==0?8:16));}else{pair[i].type=1;pair[i].data.key.vk=(ushort)key;pair[i].data.key.flags=(uint)(i==0?0:2);if(key>=33&&key<=40||key==45||key==46)pair[i].data.key.flags|=1;}}uint down=SendInput(1,new[]{pair[0]},Marshal.SizeOf(typeof(INPUT)));Thread.Sleep(35);uint up=SendInput(1,new[]{pair[1]},Marshal.SizeOf(typeof(INPUT)));return down==1&&up==1;}

 static bool Down(int key){return key>0&&(GetAsyncKeyState(key)&0x8000)!=0;}
 static void Main(string[] args){
  if(Array.IndexOf(args,"--test-number-edges")>=0){TestNumbers();return;}
  if(Array.IndexOf(args,"--test-timer-latency")>=0){TestTimer();return;}
  AppDomain.CurrentDomain.ProcessExit+=(s,e)=>SetPreciseTimer(false);
  if(Array.IndexOf(args,"--test-key-edges")>=0){TestEdges();return;}
  if(Array.IndexOf(args,"--test-switch-gates")>=0){TestSwitchGates();return;}
  try{SetProcessDpiAwarenessContext(new IntPtr(-4));}catch{}
  new Thread(()=>{string line;while((line=Console.ReadLine())!=null){var a=line.Split(' ');if(a[0]=="arm"||a[0]=="disarm"||a[0]=="step"||a[0]=="switch")switchCommands.Enqueue(line);int v,z,r;if(a.Length==4&&a[0]=="keys"&&int.TryParse(a[1],out v)&&int.TryParse(a[2],out z)&&int.TryParse(a[3],out r)&&v>=0&&v<=255&&z>=0&&z<=255&&r>=0&&r<=255){Interlocked.Exchange(ref visibilityKey,v);Interlocked.Exchange(ref zoomKey,z);Interlocked.Exchange(ref rotationKey,r);Interlocked.Increment(ref revision);}}}){IsBackground=true}.Start();
  var edges=new KeyEdges();var clock=Stopwatch.StartNew();long nextWindow=0;IntPtr h=IntPtr.Zero;int appliedRevision=-1;bool found=false;
  bool switchEnabled=false;int cycleKey=1,previousKey=2;long armedUntil=0;var digits=new NumberEdges();bool manualBefore=false,blockedBefore=false;long lastTap=-1000;
  while(true){try{
   if(clock.ElapsedMilliseconds>=nextWindow){nextWindow=clock.ElapsedMilliseconds+150;h=IntPtr.Zero;foreach(var p in Process.GetProcessesByName("SCPSL")){using(p){if(p.MainWindowHandle!=IntPtr.Zero){h=p.MainWindowHandle;break;}}}
    RECT r;var pt=new POINT();found=h!=IntPtr.Zero&&!IsIconic(h)&&IsWindowVisible(h)&&GetClientRect(h,out r)&&ClientToScreen(h,ref pt);
    // Re-read the rectangle after validity checks to keep definite assignment clear.
    if(found&&GetClientRect(h,out r)&&r.Right>r.Left&&r.Bottom>r.Top)Console.WriteLine("{\"found\":true,\"foreground\":"+(GetForegroundWindow()==h?"true":"false")+",\"x\":"+pt.X+",\"y\":"+pt.Y+",\"width\":"+(r.Right-r.Left)+",\"height\":"+(r.Bottom-r.Top)+"}");
    else{found=false;Console.WriteLine("{\"found\":false}");}
   }
   bool focus=found&&GetForegroundWindow()==h&&!IsIconic(h),mods=Down(16)||Down(17)||Down(18)||Down(91)||Down(92);
   bool manual=Down(27)||Down(1)||Down(2)||Down(cycleKey)||Down(previousKey);bool hidden=CursorHidden();
   SetPreciseTimer(switchEnabled&&focus);
   bool blocked=!focus||mods;
   if(switchEnabled&&(blocked||(manual&&!manualBefore))){armedUntil=0;if(manual&&!manualBefore||blocked&&!blockedBefore)Console.WriteLine("{\"type\":\"switch-cancel\"}");}
   manualBefore=manual;blockedBefore=blocked;
   string command;while(switchCommands.TryDequeue(out command)){var a=command.Split(' ');int parsed;
    if(a[0]=="switch"&&a.Length==4&&int.TryParse(a[2],out parsed)&&int.TryParse(a[3],out previousKey)){switchEnabled=a[1]=="1";cycleKey=parsed;armedUntil=0;for(int i=0;i<9;i++)digits.Prime(i,Down(49+i),Down(97+i));}
    else if(a[0]=="arm"&&switchEnabled&&focus&&!manual&&!mods)armedUntil=clock.ElapsedMilliseconds+500;
    else if(a[0]=="disarm")armedUntil=0;
    else if(a[0]=="step"&&a.Length==3&&int.TryParse(a[1],out parsed)){bool ok=SwitchInputGate.CanTap(switchEnabled,clock.ElapsedMilliseconds,armedUntil,lastTap,focus&&GetForegroundWindow()==h,hidden,manual,mods);
     if(ok){ok=Tap(a[2]=="-1"?previousKey:cycleKey);lastTap=clock.ElapsedMilliseconds;}Console.WriteLine("{\"type\":\"step-result\",\"id\":"+parsed+",\"ok\":"+(ok?"true":"false")+"}");}
   }
   for(int i=0;i<9;i++){bool top=Down(49+i),pad=Down(97+i);if(digits.Poll(i,top,pad,switchEnabled&&focus&&!mods&&!manual&&clock.ElapsedMilliseconds<armedUntil))Console.WriteLine("{\"type\":\"select\",\"number\":"+(i+1)+"}");}
   bool v=Down(Volatile.Read(ref visibilityKey)),z=Down(Volatile.Read(ref zoomKey)),rotate=Down(Volatile.Read(ref rotationKey));int current=Volatile.Read(ref revision);
   if(current!=appliedRevision){edges.Prime(v,z,rotate);appliedRevision=current;}
   bool modifiers=Down(16)||Down(17)||Down(18)||Down(91)||Down(92);
   int pressed=edges.Poll(found&&GetForegroundWindow()==h&&!IsIconic(h),modifiers,v,z,rotate);
   if((pressed&1)!=0)Console.WriteLine("{\"type\":\"hotkey\",\"action\":\"visibility\"}");
   if((pressed&4)!=0)Console.WriteLine("{\"type\":\"hotkey\",\"action\":\"rotate\"}");
   if((pressed&2)!=0)Console.WriteLine("{\"type\":\"hotkey\",\"action\":\"zoom\"}");
  }catch{found=false;Console.WriteLine("{\"found\":false}");}Thread.Sleep(switchEnabled?5:15);}
 }
 static void TestNumbers(){int count=0;Action<bool> ok=b=>{count++;if(!b)throw new Exception("Number edge test failed");};
 for(int i=0;i<9;i++){var e=new NumberEdges();ok(e.Poll(i,true,false,true));ok(!e.Poll(i,true,false,true));ok(e.Poll(i,true,true,true));ok(!e.Poll(i,true,true,true));e.Poll(i,false,false,true);ok(e.Poll(i,true,true,true));e.Poll(i,false,false,true);ok(!e.Poll(i,false,true,false));ok(!e.Poll(i,false,true,true));e.Poll(i,false,false,true);ok(e.Poll(i,false,true,true));e.Prime(i,true,true);ok(!e.Poll(i,true,true,true));}
 Console.WriteLine("PASS "+count+" numeric edges: main row + numpad 1-9, hold, simultaneous, cross-keyboard, disabled/focus/modifier gating, priming");
 }
 static void TestTimer(){try{foreach(bool precise in new[]{false,true}){SetPreciseTimer(precise);foreach(int ms in new[]{5,35}){var samples=new double[30];for(int i=0;i<samples.Length;i++){var sw=Stopwatch.StartNew();Thread.Sleep(ms);samples[i]=sw.Elapsed.TotalMilliseconds;}Array.Sort(samples);Console.WriteLine("Timer precise="+precise+" active="+preciseTimer+" sleep="+ms+" medianMs="+samples[15].ToString("F2"));}}}finally{SetPreciseTimer(false);}}
 static void TestSwitchGates(){int checks=0;Action<bool> ok=b=>{checks++;if(!b)throw new Exception("Switch gate failed");};
  for(int mask=0;mask<32;mask++){bool enabled=(mask&1)!=0,focus=(mask&2)!=0,hidden=(mask&4)!=0,manual=(mask&8)!=0,mods=(mask&16)!=0;ok(SwitchInputGate.CanTap(enabled,1000,1500,0,focus,hidden,manual,mods)==(mask==3||mask==7));}
  ok(!SwitchInputGate.CanTap(true,1500,1500,0,true,true,false,false));ok(!SwitchInputGate.CanTap(true,1000,1500,981,true,true,false,false));
  ok(SwitchInputGate.CanTap(true,1000,1500,980,true,true,false,false));ok(Marshal.SizeOf(typeof(INPUT))==(IntPtr.Size==8?40:28));
  Console.WriteLine("PASS "+checks+" native switch gate checks: enable, focus, visible spectator cursor accepted, manual input, modifiers, lease, throttle, INPUT layout");
 }
 static void TestEdges(){var e=new KeyEdges();Action<bool> ok=b=>{if(!b)throw new Exception("Key edge test failed");};ok(e.Poll(true,false,false,false)==0);ok(e.Poll(true,false,true,false)==1);ok(e.Poll(true,false,true,false)==0);ok(e.Poll(true,false,false,false)==0);ok(e.Poll(true,false,true,true)==3);ok(e.Poll(false,false,false,false)==0);ok(e.Poll(false,false,true,false)==0);ok(e.Poll(true,false,true,false)==0);ok(e.Poll(true,false,false,false)==0);ok(e.Poll(true,true,true,false)==0);ok(e.Poll(true,false,true,false)==0);e.Prime(true,true);ok(e.Poll(true,false,true,true)==0);ok(e.Poll(true,false,false,false)==0);ok(e.Poll(true,false,false,true)==2);e.Prime(false,false,false);ok(e.Poll(true,false,false,false,true)==4);ok(e.Poll(true,false,false,false,true)==0);ok(e.Poll(false,false,false,false,false)==0);ok(e.Poll(false,false,false,false,true)==0);ok(e.Poll(true,false,false,false,true)==0);Console.WriteLine("PASS key edges: held, focus, modifiers, rebind, simultaneous, release");}
}
