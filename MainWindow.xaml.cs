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

    private void OnSkillDoubleClick(object sender, MouseButtonEventArgs e)
    {
        if (e.ClickCount == 2 && sender is ListBox listBox && listBox.SelectedItem is SkillBase skill)
        {
            _viewModel.SkillDoubleClickCommand.Execute(skill);
        }
    }

    private void OnSkillMouseDown(object sender, MouseButtonEventArgs e)
    {
        if (e.LeftButton == MouseButtonState.Pressed && sender is Border border)
        {
            var skill = border.DataContext as SkillBase;
            if (skill != null)
            {
                DragDrop.DoDragDrop(border, skill, DragDropEffects.Move);
            }
        }
    }
}