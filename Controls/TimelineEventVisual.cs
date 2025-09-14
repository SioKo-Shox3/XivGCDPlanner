using System;
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

        public TimelineEventVisual(SkillEvent skillEvent)
        {
            SkillEvent = skillEvent;
            
            // スタイル設定
            Width = 60;
            Height = 30;
            CornerRadius = new CornerRadius(3);
            BorderThickness = new Thickness(1);
            
            // スキルタイプに応じた色分け
            if (skillEvent.Skill is GcdSkill)
            {
                Background = new SolidColorBrush(Colors.LightBlue);
                BorderBrush = new SolidColorBrush(Colors.Blue);
            }
            else if (skillEvent.Skill is AbilitySkill)
            {
                Background = new SolidColorBrush(Colors.LightGreen);
                BorderBrush = new SolidColorBrush(Colors.Green);
            }

            // 実行可能性に応じた表示変更
            if (!skillEvent.IsExecutable)
            {
                Background = new SolidColorBrush(Colors.LightCoral);
                BorderBrush = new SolidColorBrush(Colors.Red);
            }

            // テキスト表示
            Child = new TextBlock
            {
                Text = skillEvent.Skill.Name,
                HorizontalAlignment = HorizontalAlignment.Center,
                VerticalAlignment = VerticalAlignment.Center,
                FontSize = 10,
                TextWrapping = TextWrapping.Wrap
            };

            // ツールチップ
            ToolTip = $"{skillEvent.Skill.Name}\n時刻: {skillEvent.Time:F1}秒\nステータス: {(skillEvent.IsExecutable ? "実行可能" : "実行不可")}\n{skillEvent.ErrorMessage ?? ""}";

            // ドラッグ可能にする
            AllowDrop = true;
            Cursor = Cursors.Hand;
        }

        protected override void OnMouseDown(MouseButtonEventArgs e)
        {
            if (e.LeftButton == MouseButtonState.Pressed)
            {
                DragDrop.DoDragDrop(this, SkillEvent, DragDropEffects.Move);
            }
            base.OnMouseDown(e);
        }
    }
}
