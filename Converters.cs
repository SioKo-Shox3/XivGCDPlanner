using System;
using System.Globalization;
using System.Windows.Data;
using System.Windows.Media;
using XivGCDPlanner.Models;

namespace XivGCDPlanner
{
    /// <summary>
    /// 各種コンバーターを提供する静的クラス
    /// </summary>
    public static class Converters
    {
        /// <summary>
        /// null値でないかどうかを判定するコンバーター
        /// </summary>
        public static readonly IValueConverter IsNotNullConverter = new IsNotNullValueConverter();

        /// <summary>
        /// スキルタイプを文字列に変換するコンバーター
        /// </summary>
        public static readonly IValueConverter SkillTypeConverter = new SkillTypeValueConverter();

        /// <summary>
        /// 実行可能ステータスを文字列に変換するコンバーター
        /// </summary>
        public static readonly IValueConverter ExecutableStatusConverter = new ExecutableStatusValueConverter();

        /// <summary>
        /// 実行可能ステータスに応じた色を返すコンバーター
        /// </summary>
        public static readonly IValueConverter ExecutableColorConverter = new ExecutableColorValueConverter();
    }

    /// <summary>
    /// null値でないかどうかを判定するコンバーター
    /// </summary>
    public class IsNotNullValueConverter : IValueConverter
    {
        public object Convert(object value, Type targetType, object parameter, CultureInfo culture)
        {
            return value != null;
        }

        public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture)
        {
            throw new NotImplementedException();
        }
    }

    /// <summary>
    /// スキルタイプを文字列に変換するコンバーター
    /// </summary>
    public class SkillTypeValueConverter : IValueConverter
    {
        public object Convert(object value, Type targetType, object parameter, CultureInfo culture)
        {
            return value switch
            {
                GcdSkill => "GCD",
                AbilitySkill => "アビリティ",
                _ => "不明"
            };
        }

        public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture)
        {
            throw new NotImplementedException();
        }
    }

    /// <summary>
    /// 実行可能ステータスを文字列に変換するコンバーター
    /// </summary>
    public class ExecutableStatusValueConverter : IValueConverter
    {
        public object Convert(object value, Type targetType, object parameter, CultureInfo culture)
        {
            if (value is bool isExecutable)
            {
                return isExecutable ? "✓" : "✗";
            }
            return "?";
        }

        public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture)
        {
            throw new NotImplementedException();
        }
    }

    /// <summary>
    /// 実行可能ステータスに応じた色を返すコンバーター
    /// </summary>
    public class ExecutableColorValueConverter : IValueConverter
    {
        public object Convert(object value, Type targetType, object parameter, CultureInfo culture)
        {
            if (value is bool isExecutable)
            {
                return isExecutable ? Brushes.Green : Brushes.Red;
            }
            return Brushes.Gray;
        }

        public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture)
        {
            throw new NotImplementedException();
        }
    }
}
