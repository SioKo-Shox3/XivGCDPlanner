using System.Text;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Data;
using System.Windows.Documents;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using System.Windows.Navigation;
using System.Windows.Shapes;
using XivGCDPlanner.ViewModels;
using XivGCDPlanner.Models;

namespace XivGCDPlanner;

/// <summary>
/// Interaction logic for MainWindow.xaml
/// </summary>
public partial class MainWindow : Window
{
    private MainViewModel _viewModel;

    public MainWindow()
    {
        InitializeComponent();
        
        // ViewModelを設定
        _viewModel = new MainViewModel();
        DataContext = _viewModel;
        
        // タイムラインコントロールを設定
        Loaded += OnWindowLoaded;
    }

    private void OnWindowLoaded(object sender, RoutedEventArgs e)
    {
        _viewModel.SetTimelineControl(TimelineControl);
    }

    private void OnSkillMouseDown(object sender, MouseButtonEventArgs e)
    {
        // ダブルクリックの場合はドラッグを開始しない
        if (e.LeftButton == MouseButtonState.Pressed && e.ClickCount == 1 && sender is Border border)
        {
            var skill = border.DataContext as SkillBase;
            if (skill != null)
            {
                // 少し遅延を入れてダブルクリックでないことを確認
                System.Threading.Tasks.Task.Delay(200).ContinueWith(_ =>
                {
                    Application.Current.Dispatcher.Invoke(() =>
                    {
                        if (Mouse.LeftButton == MouseButtonState.Pressed)
                        {
                            // DataObjectを使用して適切なデータ形式で設定
                            var dataObject = new DataObject();
                            dataObject.SetData(typeof(SkillBase), skill);
                            dataObject.SetData(DataFormats.Serializable, skill);
                            
                            DragDrop.DoDragDrop(border, dataObject, DragDropEffects.Move);
                        }
                    });
                });
            }
        }
    }
}