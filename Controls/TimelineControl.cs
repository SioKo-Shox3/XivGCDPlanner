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
        
        // ドラッグ状態の管理
        private bool _isDraggingSeekBar = false;
        
        // スナップハイライト用
        private Line? _snapIndicator = null;
        
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
            _timelineCanvas.MouseMove += OnTimelineMouseMove;
            _timelineCanvas.MouseLeftButtonUp += OnTimelineLeftButtonUp;
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

        private void OnSeekBarMouseDown(object sender, MouseButtonEventArgs e)
        {
            _isDraggingSeekBar = true;
            _timelineCanvas.CaptureMouse();
            e.Handled = true;
        }

        private void OnSeekBarMouseMove(object sender, MouseEventArgs e)
        {
            if (_isDraggingSeekBar && e.LeftButton == MouseButtonState.Pressed)
            {
                Point position = e.GetPosition(_timelineCanvas);
                double newTime = Math.Max(0, position.X / _pixelsPerSecond);
                SeekPosition = newTime;
                e.Handled = true;
            }
        }

        private void OnSeekBarMouseUp(object sender, MouseButtonEventArgs e)
        {
            if (_isDraggingSeekBar)
            {
                _isDraggingSeekBar = false;
                _timelineCanvas.ReleaseMouseCapture();
                e.Handled = true;
            }
        }

        private void OnTimelineRightClick(object sender, MouseButtonEventArgs e)
        {
            Point position = e.GetPosition(_timelineCanvas);
            double time = position.X / _pixelsPerSecond;
            
            TimelineRightClick?.Invoke(this, new TimelineClickEventArgs(time, position));
        }

        private void OnTimelineLeftClick(object sender, MouseButtonEventArgs e)
        {
            // タイムラインをクリックしたらその位置にシークバーを移動し、ドラッグ開始
            Point position = e.GetPosition(_timelineCanvas);
            SeekPosition = position.X / _pixelsPerSecond;
            
            // ドラッグモード開始
            _isDraggingSeekBar = true;
            _timelineCanvas.CaptureMouse();
            e.Handled = true;
        }

        private void OnTimelineMouseMove(object sender, MouseEventArgs e)
        {
            if (_isDraggingSeekBar)
            {
                // シークバーをリアルタイムで移動
                Point position = e.GetPosition(_timelineCanvas);
                SeekPosition = position.X / _pixelsPerSecond;
            }
        }

        private void OnTimelineLeftButtonUp(object sender, MouseButtonEventArgs e)
        {
            if (_isDraggingSeekBar)
            {
                // シークバーのドラッグ終了
                _isDraggingSeekBar = false;
                _timelineCanvas.ReleaseMouseCapture();
                e.Handled = true;
            }
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

        public void HandleSkillDrop(SkillDropEventArgs e)
        {
            SkillDropped?.Invoke(this, e);
        }

        /// <summary>
        /// スナップ対象となる位置を検索します（他のスキルの開始・終了位置）
        /// </summary>
        /// <param name="draggedVisual">ドラッグ中のスキルビジュアル（除外対象）</param>
        /// <param name="proposedStartTime">提案されたスキル開始時間</param>
        /// <param name="snapDistance">スナップ距離（秒単位）</param>
        /// <returns>スナップ対象の時間位置、見つからない場合はnull</returns>
        public double? FindSnapTarget(TimelineEventVisual draggedVisual, double proposedStartTime, double snapDistance = 0.5)
        {
            double? snapTarget = null;
            double closestDistance = double.MaxValue;
            
            // デバッグ用：検索対象となるビジュアルをカウント
            int candidateCount = 0;
            int checkedCount = 0;
            string debugDetails = "";

            foreach (var visual in _eventVisuals)
            {
                candidateCount++;
                
                // ドラッグ中のスキル自身は除外
                if (visual == draggedVisual) continue;
                
                checkedCount++;

                // スキルの開始位置と終了位置を取得
                double startTime = visual.TimePosition;
                double endTime = startTime;
                
                if (visual.SkillEvent.Skill is GcdSkill gcdSkill)
                {
                    endTime += gcdSkill.BaseGcdTime;
                }
                else
                {
                    // アビリティの場合は固定時間（1.2秒として扱う）
                    endTime += 1.2;
                }

                // 1. スキルの終了位置への吸着をチェック
                double distanceToEnd = Math.Abs(proposedStartTime - endTime);
                if (distanceToEnd <= snapDistance && distanceToEnd < closestDistance)
                {
                    snapTarget = endTime;
                    closestDistance = distanceToEnd;
                    debugDetails += $"[END:{visual.SkillEvent.Skill.Name}@{endTime:F1}s,dist:{distanceToEnd:F2}s] ";
                }

                // 2. スキルの開始位置への吸着をチェック
                double distanceToStart = Math.Abs(proposedStartTime - startTime);
                if (distanceToStart <= snapDistance && distanceToStart < closestDistance)
                {
                    snapTarget = startTime;
                    closestDistance = distanceToStart;
                    debugDetails += $"[START:{visual.SkillEvent.Skill.Name}@{startTime:F1}s,dist:{distanceToStart:F2}s] ";
                }
                
                // デバッグ用：候補の詳細
                debugDetails += $"({visual.SkillEvent.Skill.Name}:{startTime:F1}-{endTime:F1}) ";
            }
            
            // デバッグ: 詳細な検索情報をコンソールとタイトルバーに出力
            string debugMessage = $"FindSnapTarget: prop={proposedStartTime:F2}s, snapDist={snapDistance:F2}s, total={candidateCount}, checked={checkedCount}, result={snapTarget?.ToString("F2") ?? "null"} {debugDetails}";
            System.Diagnostics.Debug.WriteLine(debugMessage);
            
            // タイトルバーにも表示（実際のテスト用）
            try
            {
                if (Application.Current?.MainWindow != null)
                {
                    Application.Current.MainWindow.Title = $"DEBUG: {debugMessage.Substring(0, Math.Min(debugMessage.Length, 100))}";
                }
            }
            catch { /* デバッグ表示のエラーは無視 */ }

            return snapTarget;
        }

        /// <summary>
        /// スナップ距離をピクセル単位で取得します
        /// </summary>
        public double SnapDistanceInPixels => 60.0; // より大きな範囲に変更

        /// <summary>
        /// スナップ距離を時間単位で取得します
        /// </summary>
        public double SnapDistanceInTime => SnapDistanceInPixels / _pixelsPerSecond;

        /// <summary>
        /// スナップ対象の位置にインジケーターを表示します
        /// </summary>
        /// <param name="snapTime">スナップ対象の時間位置</param>
        public void ShowSnapIndicator(double snapTime)
        {
            if (_snapIndicator == null)
            {
                _snapIndicator = new Line
                {
                    Stroke = Brushes.Orange,
                    StrokeThickness = 3,
                    Y1 = 0,
                    Y2 = 120, // タイムライン全体の高さ
                    StrokeDashArray = new DoubleCollection { 4, 2 } // 点線スタイル
                };
                _timelineCanvas.Children.Add(_snapIndicator);
            }

            double x = snapTime * _pixelsPerSecond;
            _snapIndicator.X1 = x;
            _snapIndicator.X2 = x;
            _snapIndicator.Visibility = Visibility.Visible;
        }

        /// <summary>
        /// スナップインジケーターを非表示にします
        /// </summary>
        public void HideSnapIndicator()
        {
            if (_snapIndicator != null)
            {
                _snapIndicator.Visibility = Visibility.Hidden;
            }
        }

        /// <summary>
        /// デバッグ用：現在のイベントビジュアル数を取得します
        /// </summary>
        /// <returns>タイムライン上のイベントビジュアル数</returns>
        public int GetEventVisualsCount()
        {
            return _eventVisuals.Count;
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
