using System;
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
    /// タイムライン上のスキルイベントを表すビジュアル要素
    /// </summary>
    public class TimelineEventVisual : Border
    {
        public SkillEvent SkillEvent { get; set; }
        public double TimePosition { get; set; }
        public int TrackIndex { get; set; }

        private bool _isDragging = false;
        private Point _dragStartPoint;
        private Canvas? _parentCanvas;
        private double _pixelsPerSecond;

        // スナップ状態管理
        private bool _isSnapped = false;
        private double _snappedPosition = 0;
        private double _snapDistance = 40; // スナップ検出距離（ピクセル）
        private double _releaseDistance = 60; // スナップ解除距離（ピクセル）

        public TimelineEventVisual(SkillEvent skillEvent, double pixelsPerSecond = 50)
        {
            SkillEvent = skillEvent;
            _pixelsPerSecond = pixelsPerSecond;
            
            // 幅を計算：GCDスキルの場合はGCD時間、アビリティの場合は固定幅
            double skillWidth;
            if (skillEvent.Skill is GcdSkill gcdSkill)
            {
                // GCDスキルの幅 = GCD時間（詠唱時間 + クールダウン時間） * ピクセル/秒
                skillWidth = gcdSkill.BaseGcdTime * pixelsPerSecond;
            }
            else
            {
                // アビリティは固定幅
                skillWidth = 60;
            }
            
            // スタイル設定
            Width = skillWidth;
            Height = 30;
            CornerRadius = new CornerRadius(3);
            BorderThickness = new Thickness(1);
            
            // GCDスキルの場合の表示
            if (skillEvent.Skill is GcdSkill gcdSkillVisual)
            {
                // 詠唱が必要なスキルの場合のみ上下分割表示
                if (gcdSkillVisual.CastTime > 0)
                {
                    var mainGrid = new Grid();
                    
                    // 上：スキル名、下：時間配分
                    mainGrid.RowDefinitions.Add(new RowDefinition { Height = new GridLength(2, GridUnitType.Star) }); // スキル名部分（大きめ）
                    mainGrid.RowDefinitions.Add(new RowDefinition { Height = new GridLength(1, GridUnitType.Star) }); // 時間配分部分
                    
                    // 上部：スキル名
                    var skillNamePart = new Border
                    {
                        Background = new SolidColorBrush(Colors.LightBlue),
                        CornerRadius = new CornerRadius(3, 3, 0, 0),
                        Child = new TextBlock
                        {
                            Text = skillEvent.Skill.Name,
                            HorizontalAlignment = HorizontalAlignment.Center,
                            VerticalAlignment = VerticalAlignment.Center,
                            FontSize = 10,
                            FontWeight = FontWeights.Bold,
                            Foreground = Brushes.Black,
                            TextWrapping = TextWrapping.Wrap
                        }
                    };
                    Grid.SetRow(skillNamePart, 0);
                    mainGrid.Children.Add(skillNamePart);
                    
                    // 下部：詠唱とクールダウンの時間配分（水平）
                    var timeStackPanel = new StackPanel { Orientation = Orientation.Horizontal };
                    
                    // 詠唱時間の割合を計算
                    double totalTime = gcdSkillVisual.BaseGcdTime;
                    double castRatio = gcdSkillVisual.CastTime / totalTime;
                    double cooldownRatio = gcdSkillVisual.CooldownTime / totalTime;
                    
                    // 詠唱時間部分（濃い色）
                    var castPart = new Border
                    {
                        Width = skillWidth * castRatio,
                        Background = new SolidColorBrush(Colors.DarkBlue),
                        CornerRadius = new CornerRadius(0, 0, 0, 3),
                        Child = new TextBlock
                        {
                            Text = $"{gcdSkillVisual.CastTime:F1}s",
                            HorizontalAlignment = HorizontalAlignment.Center,
                            VerticalAlignment = VerticalAlignment.Center,
                            FontSize = 8,
                            Foreground = Brushes.White
                        }
                    };
                    timeStackPanel.Children.Add(castPart);
                    
                    // クールダウン時間部分（薄い色）
                    var cooldownPart = new Border
                    {
                        Width = skillWidth * cooldownRatio,
                        Background = new SolidColorBrush(Colors.SkyBlue),
                        CornerRadius = new CornerRadius(0, 0, 3, 0),
                        Child = new TextBlock
                        {
                            Text = $"{gcdSkillVisual.CooldownTime:F1}s",
                            HorizontalAlignment = HorizontalAlignment.Center,
                            VerticalAlignment = VerticalAlignment.Center,
                            FontSize = 8,
                            Foreground = Brushes.DarkBlue
                        }
                    };
                    timeStackPanel.Children.Add(cooldownPart);
                    
                    var timeContainer = new Border
                    {
                        Child = timeStackPanel,
                        CornerRadius = new CornerRadius(0, 0, 3, 3)
                    };
                    Grid.SetRow(timeContainer, 1);
                    mainGrid.Children.Add(timeContainer);
                    
                    Child = mainGrid;
                    Background = Brushes.Transparent;
                    BorderBrush = new SolidColorBrush(Colors.Blue);
                }
                else
                {
                    // 詠唱が不要なGCDスキルの場合は通常表示
                    Background = new SolidColorBrush(Colors.LightBlue);
                    BorderBrush = new SolidColorBrush(Colors.Blue);
                    
                    Child = new TextBlock
                    {
                        Text = skillEvent.Skill.Name,
                        HorizontalAlignment = HorizontalAlignment.Center,
                        VerticalAlignment = VerticalAlignment.Center,
                        FontSize = 10,
                        TextWrapping = TextWrapping.Wrap
                    };
                }
            }
            else
            {
                // アビリティスキルの場合
                Background = new SolidColorBrush(Colors.LightGreen);
                BorderBrush = new SolidColorBrush(Colors.Green);
                
                // テキスト表示
                Child = new TextBlock
                {
                    Text = skillEvent.Skill.Name,
                    HorizontalAlignment = HorizontalAlignment.Center,
                    VerticalAlignment = VerticalAlignment.Center,
                    FontSize = 10,
                    TextWrapping = TextWrapping.Wrap
                };
            }

            // 実行可能性に応じた表示変更
            if (!skillEvent.IsExecutable)
            {
                if (skillEvent.Skill is GcdSkill gcdError && gcdError.CastTime > 0)
                {
                    // 詠唱ありGCDスキルで実行不可の場合
                    if (Child is Grid grid)
                    {
                        // スキル名部分を赤色に
                        foreach (Border border in grid.Children.OfType<Border>().Where(b => Grid.GetRow(b) == 0))
                        {
                            border.Background = new SolidColorBrush(Colors.LightCoral);
                        }
                        // 時間配分部分内のBorderも赤系に
                        foreach (Border timeContainer in grid.Children.OfType<Border>().Where(b => Grid.GetRow(b) == 1))
                        {
                            if (timeContainer.Child is StackPanel sp)
                            {
                                foreach (Border timeBorder in sp.Children.OfType<Border>())
                                {
                                    if (timeBorder.Background is SolidColorBrush brush && brush.Color == Colors.DarkBlue)
                                    {
                                        timeBorder.Background = new SolidColorBrush(Colors.DarkRed);
                                    }
                                    else
                                    {
                                        timeBorder.Background = new SolidColorBrush(Colors.Red);
                                    }
                                }
                            }
                        }
                        BorderBrush = new SolidColorBrush(Colors.Red);
                    }
                }
                else
                {
                    // その他のスキルで実行不可の場合
                    Background = new SolidColorBrush(Colors.LightCoral);
                    BorderBrush = new SolidColorBrush(Colors.Red);
                }
            }

            // ツールチップ
            if (skillEvent.Skill is GcdSkill gcdTooltip)
            {
                ToolTip = $"{skillEvent.Skill.Name}\n時刻: {skillEvent.Time:F1}秒\n詠唱: {gcdTooltip.CastTime:F1}秒\nクールダウン: {gcdTooltip.CooldownTime:F1}秒\nGCD合計: {gcdTooltip.BaseGcdTime:F1}秒\nステータス: {(skillEvent.IsExecutable ? "実行可能" : "実行不可")}\n{skillEvent.ErrorMessage ?? ""}";
            }
            else
            {
                ToolTip = $"{skillEvent.Skill.Name}\n時刻: {skillEvent.Time:F1}秒\nステータス: {(skillEvent.IsExecutable ? "実行可能" : "実行不可")}\n{skillEvent.ErrorMessage ?? ""}";
            }

            // ドラッグ可能にする
            AllowDrop = true;
            Cursor = Cursors.Hand;
            
            // マウスイベントハンドラーを追加
            MouseLeftButtonDown += OnMouseLeftButtonDown;
            MouseMove += OnMouseMove;
            MouseLeftButtonUp += OnMouseLeftButtonUp;
            MouseLeave += OnMouseLeave;
        }

        private void OnMouseLeftButtonDown(object sender, MouseButtonEventArgs e)
        {
            if (e.ClickCount == 2)
            {
                // ダブルクリックの場合はドラッグを開始しない
                return;
            }

            _isDragging = true;
            _dragStartPoint = e.GetPosition(this);
            _parentCanvas = Parent as Canvas;
            
            // スナップ状態をリセット
            _isSnapped = false;
            _snappedPosition = 0;
            
            CaptureMouse();
            e.Handled = true;
        }

        private void OnMouseMove(object sender, MouseEventArgs e)
        {
            if (_isDragging && e.LeftButton == MouseButtonState.Pressed && _parentCanvas != null)
            {
                Point currentPosition = e.GetPosition(_parentCanvas);
                double rawProposedX = currentPosition.X - _dragStartPoint.X;
                
                // 位置を制限（負の値にならないように）
                if (rawProposedX < 0) rawProposedX = 0;
                
                // 生の時間位置を計算
                double rawProposedTime = rawProposedX / _pixelsPerSecond;
                
                double finalTime = rawProposedTime;
                double finalX = rawProposedX;
                
                // TimelineControlを取得
                if (_parentCanvas.Parent is TimelineControl timelineControl)
                {
                    // デバッグ: タイムライン上のスキル数を確認
                    try
                    {
                        var window = Window.GetWindow(this);
                        if (window != null)
                        {
                            int totalVisuals = timelineControl.GetEventVisualsCount();
                            window.Title = $"FF14 GCD Planner - Drag: {rawProposedTime:F1}s, Visuals: {totalVisuals}";
                        }
                    }
                    catch { /* デバッグ表示のエラーは無視 */ }
                    
                    if (_isSnapped)
                    {
                        // 既にスナップ中の場合、解除距離をチェック
                        double currentSnapX = _snappedPosition * _pixelsPerSecond;
                        double distanceFromSnap = Math.Abs(rawProposedX - currentSnapX);
                        
                        if (distanceFromSnap <= _releaseDistance)
                        {
                            // まだスナップ範囲内なので、スナップ位置を維持
                            finalTime = _snappedPosition;
                            finalX = currentSnapX;
                            timelineControl.ShowSnapIndicator(_snappedPosition);
                            
                            // デバッグ: スナップ維持
                            try
                            {
                                var window = Window.GetWindow(this);
                                if (window != null)
                                {
                                    window.Title = $"FF14 GCD Planner - MAINTAINING SNAP at {_snappedPosition:F1}s (dist: {distanceFromSnap:F0}px)";
                                }
                            }
                            catch { /* デバッグ表示のエラーは無視 */ }
                        }
                        else
                        {
                            // 解除距離を超えたので、スナップを解除
                            _isSnapped = false;
                            _snappedPosition = 0;
                            timelineControl.HideSnapIndicator();
                            // マウス位置に従う
                            finalTime = rawProposedTime;
                            finalX = rawProposedX;
                            
                            // デバッグ: スナップ解除
                            try
                            {
                                var window = Window.GetWindow(this);
                                if (window != null)
                                {
                                    window.Title = $"FF14 GCD Planner - SNAP RELEASED (dist: {distanceFromSnap:F0}px > {_releaseDistance})";
                                }
                            }
                            catch { /* デバッグ表示のエラーは無視 */ }
                        }
                    }
                    else
                    {
                        // スナップしていない場合、新しいスナップ対象を検索
                        double snapDistance = timelineControl.SnapDistanceInTime;
                        double? snapTarget = timelineControl.FindSnapTarget(this, rawProposedTime, snapDistance);
                        
                        // デバッグ: スナップ検索結果
                        try
                        {
                            var window = Window.GetWindow(this);
                            if (window != null)
                            {
                                if (snapTarget.HasValue)
                                {
                                    window.Title = $"FF14 GCD Planner - SNAP FOUND: {snapTarget.Value:F1}s (dist: {snapDistance:F2}s)";
                                }
                                else
                                {
                                    window.Title = $"FF14 GCD Planner - No snap at {rawProposedTime:F1}s (search dist: {snapDistance:F2}s)";
                                }
                            }
                        }
                        catch { /* デバッグ表示のエラーは無視 */ }
                        
                        if (snapTarget.HasValue)
                        {
                            // 新しいスナップ対象が見つかった場合
                            _isSnapped = true;
                            _snappedPosition = snapTarget.Value;
                            finalTime = snapTarget.Value;
                            finalX = finalTime * _pixelsPerSecond;
                            timelineControl.ShowSnapIndicator(snapTarget.Value);
                        }
                        else
                        {
                            // スナップ対象がない場合、マウス位置に従う
                            finalTime = rawProposedTime;
                            finalX = rawProposedX;
                            timelineControl.HideSnapIndicator();
                        }
                    }
                }
                
                // 最終位置を設定
                Point newPosition = new Point(finalX, Canvas.GetTop(this));
                Canvas.SetLeft(this, newPosition.X);
                TimePosition = finalTime;
                
                e.Handled = true;
            }
        }

        private void OnMouseLeftButtonUp(object sender, MouseButtonEventArgs e)
        {
            if (_isDragging)
            {
                _isDragging = false;
                ReleaseMouseCapture();
                
                // スナップ状態をクリア
                _isSnapped = false;
                _snappedPosition = 0;
                
                // ドラッグ終了時にスナップインジケーターを非表示
                if (_parentCanvas?.Parent is TimelineControl timelineCtrl)
                {
                    timelineCtrl.HideSnapIndicator();
                }
                
                // 最終的なドロップ処理
                if (_parentCanvas != null)
                {
                    // 新しい時間位置を計算
                    double newTime = Canvas.GetLeft(this) / _pixelsPerSecond;
                    
                    // TimelineControlのSkillDroppedイベントを発生させる
                    if (_parentCanvas.Parent is TimelineControl timelineControl)
                    {
                        var skillDropEventArgs = new SkillDropEventArgs(SkillEvent.Skill, newTime, SkillEvent);
                        
                        // パブリックメソッドを使って処理
                        timelineControl.HandleSkillDrop(skillDropEventArgs);
                    }
                }
                
                e.Handled = true;
            }
        }

        private void OnMouseLeave(object sender, MouseEventArgs e)
        {
            if (_isDragging && e.LeftButton != MouseButtonState.Pressed)
            {
                _isDragging = false;
                ReleaseMouseCapture();
            }
        }

        protected override void OnMouseDown(MouseButtonEventArgs e)
        {
            // 従来のドラッグ処理は無効化
            base.OnMouseDown(e);
        }
    }
}
