using System.Collections.ObjectModel;
using System.Linq;
using System.Windows.Input;
using System.Windows;
using XivGCDPlanner.Models;
using XivGCDPlanner.Services;
using XivGCDPlanner.Controls;

namespace XivGCDPlanner.ViewModels
{
    /// <summary>
    /// メインウィンドウのViewModel
    /// </summary>
    public class MainViewModel : ViewModelBase
    {
        private readonly SkillDataService _skillDataService;
        private Timeline _timeline;
        private SkillBase? _selectedSkill;
        private double _selectedTime;
        private double _seekPosition;
        private int _spellSpeed = 400;
        private TimelineControl? _timelineControl;

        public MainViewModel()
        {
            _skillDataService = new SkillDataService();
            _timeline = new Timeline();
            
            InitializeSkills();
            InitializeCommands();
        }

        #region Properties

        /// <summary>
        /// タイムライン
        /// </summary>
        public Timeline Timeline
        {
            get => _timeline;
            set => SetProperty(ref _timeline, value);
        }

        /// <summary>
        /// 利用可能なGCDスキル
        /// </summary>
        public ObservableCollection<GcdSkill> AvailableGcdSkills { get; } = new ObservableCollection<GcdSkill>();

        /// <summary>
        /// 利用可能なアビリティスキル
        /// </summary>
        public ObservableCollection<AbilitySkill> AvailableAbilitySkills { get; } = new ObservableCollection<AbilitySkill>();

        /// <summary>
        /// タイムラインイベント
        /// </summary>
        public ObservableCollection<SkillEvent> TimelineEvents { get; } = new ObservableCollection<SkillEvent>();

        /// <summary>
        /// 選択されたスキル
        /// </summary>
        public SkillBase? SelectedSkill
        {
            get => _selectedSkill;
            set => SetProperty(ref _selectedSkill, value);
        }

        /// <summary>
        /// 選択された時刻
        /// </summary>
        public double SelectedTime
        {
            get => _selectedTime;
            set => SetProperty(ref _selectedTime, value);
        }

        /// <summary>
        /// シーク位置
        /// </summary>
        public double SeekPosition
        {
            get => _seekPosition;
            set => SetProperty(ref _seekPosition, value);
        }

        /// <summary>
        /// スペルスピード
        /// </summary>
        public int SpellSpeed
        {
            get => _spellSpeed;
            set
            {
                if (SetProperty(ref _spellSpeed, value))
                {
                    Timeline.SpellSpeed = value;
                    UpdateSpellSpeedForAllSkills();
                    RefreshTimeline();
                }
            }
        }

        /// <summary>
        /// タイムライン統計
        /// </summary>
        public TimelineStatistics? Statistics { get; private set; }

        #endregion

        #region Commands

        /// <summary>
        /// スキル追加コマンド
        /// </summary>
        public ICommand AddSkillCommand { get; private set; } = null!;

        /// <summary>
        /// イベント削除コマンド
        /// </summary>
        public ICommand RemoveEventCommand { get; private set; } = null!;

        /// <summary>
        /// タイムラインクリアコマンド
        /// </summary>
        public ICommand ClearTimelineCommand { get; private set; } = null!;

        /// <summary>
        /// タイムライン検証コマンド
        /// </summary>
        public ICommand ValidateTimelineCommand { get; private set; } = null!;

        /// <summary>
        /// スキルダブルクリックコマンド
        /// </summary>
        public ICommand SkillDoubleClickCommand { get; private set; } = null!;

        #endregion

        #region Private Methods

        /// <summary>
        /// スキルを初期化
        /// </summary>
        private void InitializeSkills()
        {
            // GCDスキルを追加
            var gcdSkills = _skillDataService.GetSampleGcdSkills();
            foreach (var skill in gcdSkills)
            {
                Timeline.AddGcdSkill(skill);
                AvailableGcdSkills.Add(skill);
            }

            // アビリティスキルを追加
            var abilitySkills = _skillDataService.GetSampleAbilitySkills();
            foreach (var ability in abilitySkills)
            {
                Timeline.AddAbilitySkill(ability);
                AvailableAbilitySkills.Add(ability);
            }
        }

        /// <summary>
        /// コマンドを初期化
        /// </summary>
        private void InitializeCommands()
        {
            AddSkillCommand = new RelayCommand(
                execute: () => AddSkill(),
                canExecute: () => SelectedSkill != null && SelectedTime >= 0
            );

            RemoveEventCommand = new RelayCommand(
                execute: (parameter) => RemoveEvent(parameter as SkillEvent),
                canExecute: (parameter) => parameter is SkillEvent
            );

            ClearTimelineCommand = new RelayCommand(
                execute: () => ClearTimeline()
            );

            ValidateTimelineCommand = new RelayCommand(
                execute: () => RefreshTimeline()
            );

            SkillDoubleClickCommand = new RelayCommand(
                execute: (parameter) => AddSkillAtSeekPosition(parameter as SkillBase),
                canExecute: (parameter) => parameter is SkillBase
            );
        }

        /// <summary>
        /// スキルをタイムラインに追加
        /// </summary>
        private void AddSkill()
        {
            if (SelectedSkill == null) return;

            Timeline.AddSkillEvent(SelectedTime, SelectedSkill);
            RefreshTimeline();
        }

        /// <summary>
        /// イベントを削除
        /// </summary>
        /// <param name="skillEvent">削除するイベント</param>
        private void RemoveEvent(SkillEvent? skillEvent)
        {
            if (skillEvent == null) return;

            Timeline.RemoveSkillEvent(skillEvent);
            RefreshTimeline();
        }

        /// <summary>
        /// タイムラインをクリア
        /// </summary>
        private void ClearTimeline()
        {
            Timeline.Events.Clear();
            RefreshTimeline();
        }

        /// <summary>
        /// タイムラインを更新
        /// </summary>
        private void RefreshTimeline()
        {
            Timeline.ValidateTimeline();
            
            // イベントリストを更新
            TimelineEvents.Clear();
            foreach (var evt in Timeline.Events.OrderBy(e => e.Time))
            {
                TimelineEvents.Add(evt);
            }

            // 統計を更新
            Statistics = Timeline.GetStatistics();
            OnPropertyChanged(nameof(Statistics));
        }

        /// <summary>
        /// 全GCDスキルのスペルスピードを更新
        /// </summary>
        private void UpdateSpellSpeedForAllSkills()
        {
            var modifier = Timeline.SpellSpeedModifier;
            foreach (var skill in Timeline.GcdSkills)
            {
                skill.SpellSpeedModifier = modifier;
            }
        }

        /// <summary>
        /// シーク位置にスキルを追加
        /// </summary>
        /// <param name="skill">追加するスキル</param>
        private void AddSkillAtSeekPosition(SkillBase? skill)
        {
            if (skill == null) return;

            try
            {
                Timeline.AddSkillEvent(SeekPosition, skill);
                RefreshTimeline();
                _timelineControl?.RefreshTimeline();
            }
            catch (System.Exception ex)
            {
                MessageBox.Show($"スキルを配置できませんでした: {ex.Message}", "エラー", 
                    MessageBoxButton.OK, MessageBoxImage.Warning);
            }
        }

        /// <summary>
        /// タイムラインコントロールを設定
        /// </summary>
        /// <param name="timelineControl">タイムラインコントロール</param>
        public void SetTimelineControl(TimelineControl timelineControl)
        {
            _timelineControl = timelineControl;
            _timelineControl.Timeline = Timeline;
            
            // イベントハンドラーを登録
            _timelineControl.TimelineRightClick += OnTimelineRightClick;
            _timelineControl.SkillDropped += OnSkillDropped;
            _timelineControl.SeekPositionChanged += OnSeekPositionChanged;
            
            _timelineControl.RefreshTimeline();
        }

        /// <summary>
        /// タイムライン右クリック処理
        /// </summary>
        private void OnTimelineRightClick(object? sender, TimelineClickEventArgs e)
        {
            // コンテキストメニューの代わりに直接時刻を設定
            SelectedTime = e.Time;
        }

        /// <summary>
        /// スキルドロップ処理
        /// </summary>
        private void OnSkillDropped(object? sender, SkillDropEventArgs e)
        {
            try
            {
                // 元のイベントがある場合は削除
                if (e.OriginalEvent != null)
                {
                    Timeline.RemoveSkillEvent(e.OriginalEvent);
                }

                // 新しい位置にスキルを追加
                Timeline.AddSkillEvent(e.Time, e.Skill);
                RefreshTimeline();
                _timelineControl?.RefreshTimeline();
            }
            catch (System.Exception ex)
            {
                MessageBox.Show($"スキルを配置できませんでした: {ex.Message}", "エラー", 
                    MessageBoxButton.OK, MessageBoxImage.Warning);
            }
        }

        /// <summary>
        /// シーク位置変更処理
        /// </summary>
        private void OnSeekPositionChanged(object? sender, double seekPosition)
        {
            SeekPosition = seekPosition;
        }

        #endregion
    }
}
