using System.Security.Cryptography;

namespace Lymoon.API.Helpers;

public static class InviteCodeGenerator
{
    private static readonly char[] Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".ToCharArray();

    public static string Generate()
    {
        var result = new char[6];
        var bytes = new byte[6];
        RandomNumberGenerator.Fill(bytes);
        for (int i = 0; i < 6; i++)
            result[i] = Chars[bytes[i] % Chars.Length];
        return new string(result);
    }
}
