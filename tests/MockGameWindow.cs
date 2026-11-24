using System;using System.Drawing;using System.Windows.Forms;using System.Runtime.InteropServices;using System.Threading.Tasks;
class MockGameWindow:Form {
 [StructLayout(LayoutKind.Sequential)]struct RECT{public int Left,Top,Right,Bottom;}
 [StructLayout(LayoutKind.Sequential)]struct POINT{public int X,Y;}
 [DllImport("user32.dll")]static extern bool GetWindowRect(IntPtr h,out RECT r);
 [DllImport("user32.dll")]static extern bool GetClientRect(IntPtr h,out RECT r);
 [DllImport("user32.dll")]static extern bool ClientToScreen(IntPtr h,ref POINT p);
 [DllImport("user32.dll")]static extern bool SetProcessDpiAwarenessContext(IntPtr context);
 [DllImport("user32.dll")]static extern bool SetForegroundWindow(IntPtr handle);
 [DllImport("user32.dll")]static extern bool ShowWindow(IntPtr handle,int command);
 [DllImport("user32.dll")]static extern bool AllowSetForegroundWindow(int processId);
 [DllImport("user32.dll")]static extern IntPtr GetForegroundWindow();
 [DllImport("user32.dll")]static extern uint GetWindowThreadProcessId(IntPtr handle,out uint processId);
 [DllImport("kernel32.dll")]static extern uint GetCurrentThreadId();
 [DllImport("user32.dll")]static extern bool AttachThreadInput(uint from,uint to,bool attach);
 MockGameWindow(){Text="MZ 本地通信测试 · 模拟游戏窗口（非真实 SCP:SL）";BackColor=Color.FromArgb(20,28,38);ForeColor=Color.White;ClientSize=new Size(1280,720);StartPosition=FormStartPosition.Manual;Location=new Point(80,60);FormBorderStyle=FormBorderStyle.None;
  var label=new Label{Text="MZ 本地端到端测试\n模拟游戏窗口 · 不是实际游戏\nHUD 来自本机模拟服务器的 WebSocket 数据",AutoSize=true,Font=new Font("Microsoft YaHei",17),Location=new Point(420,300)};Controls.Add(label);
  Shown+=(s,e)=>{Console.WriteLine("ready");Task.Run(()=>{string line;while((line=Console.ReadLine())!=null){var command=line;try{BeginInvoke(new Action(()=>Act(command)));}catch{break;}}});};
 }
 void Act(string command){if(command.StartsWith("background:")){var target=new IntPtr(long.Parse(command.Substring(11)));ShowWindow(target,9);SetForegroundWindow(target);Console.WriteLine(command);return;}if(command.StartsWith("measure:")){RECT actual,client;GetWindowRect(new IntPtr(long.Parse(command.Substring(8))),out actual);GetClientRect(Handle,out client);var point=new POINT();ClientToScreen(Handle,ref point);Console.WriteLine("MEASURE "+point.X+","+point.Y+","+client.Right+","+client.Bottom+","+actual.Left+","+actual.Top+","+(actual.Right-actual.Left)+","+(actual.Bottom-actual.Top)+","+(GetForegroundWindow()==Handle?1:0));return;}switch(command){case "focus":WindowState=FormWindowState.Normal;Show();ShowWindow(Handle,9);uint pid;var foreign=GetWindowThreadProcessId(GetForegroundWindow(),out pid);var current=GetCurrentThreadId();bool attached=foreign!=current&&AttachThreadInput(current,foreign,true);try{Activate();SetForegroundWindow(Handle);}finally{if(attached)AttachThreadInput(current,foreign,false);}AllowSetForegroundWindow(-1);break;case "resize":ClientSize=new Size(1100,650);Location=new Point(150,90);break;case "minimize":WindowState=FormWindowState.Minimized;break;case "exit":Close();break;}Console.WriteLine(command);}
 [STAThread]static void Main(){try{SetProcessDpiAwarenessContext(new IntPtr(-4));}catch{}Application.EnableVisualStyles();Application.Run(new MockGameWindow());}
}
