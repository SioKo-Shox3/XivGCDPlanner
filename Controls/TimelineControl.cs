using System;
using System.Collections.Generic;
using System.Linq;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Shapes;
using XivGCDPlanner.Models;

namespace XivGCDPlanner.Controls
{
    /// <summary>
    /// 横型タイムラインコントロール
    /// </summary>
    public class TimelineControl : UserControl
    {
        private Canvas _timelineCanvas = null!;
        private ScrollViewer _scrollViewer = null!;
        private Line _seekBar = null!;
        private double _seekPosition = 0;
        private double _pixelsPerSecond = 50;
        private readonly List<TimelineEventVisual> _eventVisuals = new List<TimelineEventVisual>();
        
        // トラック設定
        private const int GcdTrackIndex = 0;
        private const int AbilityTrackIndex = 1;
        private const int TrackHeight = 40;
        private const int TrackSpacing = 10;

        public Timeline Timeline { get; set; } = null!;

        public event EventHandler<TimelineClickEventArgs>? TimelineRightClick;
        public event EventHandler<SkillDropEventArgs>? SkillDropped;
        public event EventHandler<double>? SeekPositionChanged;

        public double SeekPosition
        {
            get => _seekPosition;
            set
            {
                _seekPosition = value;
                UpdateSeekBar();
                SeekPositionChanged?.Invoke(this, value);
            }
        }

        public double PixelsPerSecond
        {
            get => _pixelsPerSecond;
            set
            {
                _pixelsPerSecond = value;
                RefreshTimeline();
            }
        }

        public TimelineControl()
        {
            InitializeComponent();
        }

        private void InitializeComponent()
        {
            // スクロールビューアーを作成
            _scrollViewer = new ScrollViewer
            {
                HorizontalScrollBarVisibility = ScrollBarVisibility.Auto,
                VerticalScrollBarVisibility = ScrollBarVisibility.Disabled,
                CanContentScroll = true
            };

            // メインキャンバスを作成
            _timelineCanvas = new Canvas
            {
                Background = new SolidColorBrush(Color.FromRgb(240, 240, 240)),
                Height = (TrackHeight + TrackSpacing) * 3, // GCD + アビリティ + 余白
                ClipToBounds = true
            };

            // キャンバスにイベントハンドラーを追加
            _timelineCanvas.MouseRightButtonDown += OnTimelineRightClick;
            _timelineCanvas.MouseLeftButtonDown += OnTimelineLeftClick;
            _timelineCanvas.AllowDrop = true;
            _timelineCanvas.Drop += OnCanvasDrop;
            _timelineCanvas.DragOver += OnCanvasDragOver;

            _scrollViewer.Content = _timelineCanvas;
            Content = _scrollViewer;

            // シークバーを作成
            _seekBar = new Line
            {
                Stroke = Brushes.Red,
                StrokeThickness = 2,
                Y1 = 0,
                Y2 = _timelineCanvas.Height
            };
            _timelineCanvas.Children.Add(_seekBar);

            DrawTimelineBackground();
        }

        private void DrawTimelineBackground()
        {
            _timelineCanvas.Children.Clear();
            _timelineCanvas.Children.Add(_seekBar);

            double totalWidth = 600; // 10分間 = 600秒
            _timelineCanvas.Width = totalWidth * _pixelsPerSecond;

            // 時間目盛りを描画
            for (int second = 0; second <= totalWidth; second += 10)
            {
                double x = second * _pixelsPerSecond;
                
                // 10秒毎のメイン目盛り
                var majorTick = new Line
                {
                    X1 = x, X2 = x,
                    Y1 = 0, Y2 = 15,
                    Stroke = Brushes.Gray,
                    StrokeThickness = 1
                };
                _timelineCanvas.Children.Add(majorTick);

                // 時間ラベル
                var label = new TextBlock
                {
                    Text = $"{second}s",
                    FontSize = 10,
                    Foreground = Brushes.Gray
                };
                Canvas.SetLeft(label, x + 2);
                Canvas.SetTop(label, 2);
                _timelineCanvas.Children.Add(label);

                // 5秒毎のサブ目盛り
                if (second + 5 <= totalWidth)
                {
                    var minorTick = new Line
                    {
                        X1 = (second + 5) * _pixelsPerSecond,
                        X2 = (second + 5) * _pixelsPerSecond,
                        Y1 = 0, Y2 = 8,
                        Stroke = Brushes.LightGray,
                        StrokeThickness = 1
                    };
                    _timelineCanvas.Children.Add(minorTick);
                }
            }

            // トラック区切り線
            for (int track = 0; track <= 2; track++)
            {
                double y = 20 + track * (TrackHeight + TrackSpacing);
                var trackLine = new Line
                {
                    X1 = 0, X2 = _timelineCanvas.Width,
                    Y1 = y, Y2 = y,
                    Stroke = Brushes.DarkGray,
                    StrokeThickness = 1
                };
                _timelineCanvas.Children.Add(trackLine);
            }

            // トラックラベル
            var gcdLabel = new TextBlock
            {
                Text = "GCD",
                FontWeight = FontWeights.Bold,
                Foreground = Brushes.Blue
            };
            Canvas.SetLeft(gcdLabel, 5);
            Canvas.SetTop(gcdLabel, 25 + GcdTrackIndex * (TrackHeight + TrackSpacing));
            _timelineCanvas.Children.Add(gcdLabel);

            var abilityLabel = new TextBlock
            {
                Text = "アビリティ",
                FontWeight = FontWeights.Bold,
                Foreground = Brushes.Green
            };
            Canvas.SetLeft(abilityLabel, 5);
            Canvas.SetTop(abilityLabel, 25 + AbilityTrackIndex * (TrackHeight + TrackSpacing));
            _timelineCanvas.Children.Add(abilityLabel);
        }

        public void RefreshTimeline()
        {
            DrawTimelineBackground();
            
            if (Timeline?.Events == null) return;

            // 既存のイベントビジュアルをクリア
            foreach (var visual in _eventVisuals)
            {
                _timelineCanvas.Children.Remove(visual);
            }
            _eventVisuals.Clear();

            // 新しいイベントビジュアルを追加
            foreach (var skillEvent in Timeline.Events.OrderBy(e => e.Time))
            {
                AddEventVisual(skillEvent);
            }

            UpdateSeekBar();
        }

        private void AddEventVisual(SkillEvent skillEvent)
        {
            var visual = new TimelineEventVisual(skillEvent, _pixelsPerSecond);
            
            // 位置を計算
            double x = skillEvent.Time * _pixelsPerSecond;
            int trackIndex = skillEvent.Skill is GcdSkill ? GcdTrackIndex : AbilityTrackIndex;
            double y = 25 + trackIndex * (TrackHeight + TrackSpacing);

            Canvas.SetLeft(visual, x);
            Canvas.SetTop(visual, y);

            _timelineCanvas.Children.Add(visual);
            _eventVisuals.Add(visual);
        }

        private void UpdateSeekBar()
        {
            double x = _seekPosition * _pixelsPerSecond;
            _seekBar.X1 = x;
            _seekBar.X2 = x;
        }

        private void OnTimelineRightClick(object sender, MouseButtonEventArgs e)
        {
            Point position = e.GetPosition(_timelineCanvas);
            double time = position.X / _pixelsPerSecond;
            
            TimelineRightClick?.Invoke(this, new TimelineClickEventArgs(time, position));
        }

        private void OnTimelineLeftClick(object sender, MouseButtonEventArgs e)
        {
            Point position = e.GetPosition(_timelineCanvas);
            SeekPosition = position.X / _pixelsPerSecond;
        }

        private void OnCanvasDragOver(object sender, DragEventArgs e)
        {
            if (e.Data.GetDataPresent(typeof(SkillBase)) || 
                e.Data.GetDataPresent(typeof(SkillEvent)) ||
                e.Data.GetDataPresent(DataFormats.Serializable))
            {
                e.Effects = DragDropEffects.Move;
            }
            else
            {
                e.Effects = DragDropEffects.None;
            }
            e.Handled = true;
        }

        private void OnCanvasDrop(object sender, DragEventArgs e)
        {
            Point position = e.GetPosition(_timelineCanvas);
            double time = position.X / _pixelsPerSecond;

            SkillBase? skill = null;
            SkillEvent? originalEvent = null;

            // データの取得を試行
            if (e.Data.GetDataPresent(typeof(SkillBase)))
            {
                skill = (SkillBase)e.Data.GetData(typeof(SkillBase));
            }
            else if (e.Data.GetDataPresent(DataFormats.Serializable))
            {
                var data = e.Data.GetData(DataFormats.Serializable);
                if (data is SkillBase skillData)
                {
                    skill = skillData;
                }
                else if (data is SkillEvent skillEventData)
                {
                    skill = skillEventData.Skill;
                    originalEvent = skillEventData;
                }
            }
            else if (e.Data.GetDataPresent(typeof(SkillEvent)))
            {
                var skillEvent = (SkillEvent)e.Data.GetData(typeof(SkillEvent));
                skill = skillEvent.Skill;
                originalEvent = skillEvent;
            }

            if (skill != null)
            {
                SkillDropped?.Invoke(this, new SkillDropEventArgs(skill, time, originalEvent));
            }
            
            e.Handled = true;
        }

        public void AddSkillAtTime(SkillBase skill, double time)
        {
            try
            {
                if (Timeline == null) return;

                var skillEvent = Timeline.AddSkillEvent(time, skill);
                AddEventVisual(skillEvent);
            }
            catch (Exception ex)
            {
                MessageBox.Show($"スキルを配置できませんでした: {ex.Message}", "エラー", 
                    MessageBoxButton.OK, MessageBoxImage.Warning);
            }
        }
    }

    public class TimelineClickEventArgs : EventArgs
    {
        public double Time { get; }
        public Point Position { get; }

        public TimelineClickEventArgs(double time, Point position)
        {
            Time = time;
            Position = position;
        }
    }

    public class SkillDropEventArgs : EventArgs
    {
        public SkillBase Skill { get; }
        public double Time { get; }
        public SkillEvent? OriginalEvent { get; }

        public SkillDropEventArgs(SkillBase skill, double time, SkillEvent? originalEvent = null)
        {
            Skill = skill;
            Time = time;
            OriginalEvent = originalEvent;
        }
    }
}
